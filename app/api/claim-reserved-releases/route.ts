import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/claim-reserved-releases
 * Called after a new user registers to claim any releases pre-created for their nickname.
 * Body: { userId: string, nickname: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, nickname } = await request.json();

    if (!userId || !nickname) {
      return NextResponse.json({ error: 'userId and nickname required' }, { status: 400 });
    }

    // Verify the user exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, nickname')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all releases reserved for this nickname (case-insensitive)
    const { data: reservedReleases, error: fetchError } = await supabaseAdmin
      .from('releases_exclusive')
      .select('id, title, artist_name')
      .is('user_id', null)
      .ilike('reserved_nickname', nickname);

    if (fetchError) {
      console.error('Error fetching reserved releases:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!reservedReleases || reservedReleases.length === 0) {
      return NextResponse.json({ claimed: 0, releases: [] });
    }

    // Claim them all
    const releaseIds = reservedReleases.map(r => r.id);
    const { error: updateError } = await supabaseAdmin
      .from('releases_exclusive')
      .update({ user_id: userId, reserved_nickname: null })
      .in('id', releaseIds);

    if (updateError) {
      console.error('Error claiming releases:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Also claim any matching track_statistics (link user_id for reports where userId was null but nickname matches)
    // This works because track_statistics may have been saved with user_id from the release
    // after claiming the release, the statistics are already linked via release_id
    // No further action needed for statistics

    console.log(`Claimed ${reservedReleases.length} releases for user ${userId} (${nickname})`);

    return NextResponse.json({
      claimed: reservedReleases.length,
      releases: reservedReleases.map(r => ({ id: r.id, title: r.title, artist: r.artist_name }))
    });

  } catch (error) {
    console.error('Error in claim-reserved-releases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
