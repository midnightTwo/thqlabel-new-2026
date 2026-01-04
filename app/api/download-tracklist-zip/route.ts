import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get('releaseId');
    const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive';

    if (!releaseId || !releaseType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get release data
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error: releaseError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      );
    }

    // Create ZIP archive
    const zip = new JSZip();
    const tracks = Array.isArray(release.tracks) ? release.tracks : [];

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found' },
        { status: 404 }
      );
    }

    console.log(`📦 Processing ${tracks.length} tracks for ZIP...`);

    // Download and add each track to ZIP
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      console.log(`Track ${i}:`, JSON.stringify(track, null, 2));
      
      // Get the audio file path - check field 'link' primarily
      let audioPath = track.link || track.audio_url || track.audioFile || track.audioUrl || track.url;
      
      if (!audioPath || typeof audioPath !== 'string') {
        console.warn(`⚠️ Track ${i} (${track.title}) has no valid audio path. Track data:`, track);
        continue;
      }

      audioPath = audioPath.trim();
      console.log(`✓ Track ${i} audio path:`, audioPath);

      try {
        let audioData: ArrayBuffer;
        let fileExtension = 'mp3'; // default

        // If it's a Supabase storage URL
        if (audioPath.includes('supabase') && audioPath.includes('/storage/v1/object/public/')) {
          const urlParts = audioPath.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const [bucket, ...pathParts] = urlParts[1].split('/');
            const path = decodeURIComponent(pathParts.join('/'));
            
            console.log(`📥 Downloading from Supabase storage: bucket=${bucket}, path=${path}`);
            
            // Extract file extension from path
            const ext = path.split('.').pop()?.toLowerCase();
            if (ext && ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) {
              fileExtension = ext;
            }
            
            // Download directly from storage
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(bucket)
              .download(path);

            if (downloadError || !fileData) {
              console.error(`❌ Error downloading track ${i}:`, downloadError);
              continue;
            }

            audioData = await fileData.arrayBuffer();
            console.log(`✅ Downloaded ${audioData.byteLength} bytes`);
          } else {
            // Fallback to fetch
            console.log(`📥 Fetching from URL (fallback):`, audioPath);
            const response = await fetch(audioPath);
            if (!response.ok) {
              console.error(`❌ Failed to fetch track ${i}: ${response.status} ${response.statusText}`);
              continue;
            }
            audioData = await response.arrayBuffer();
            console.log(`✅ Fetched ${audioData.byteLength} bytes`);
          }
        } else {
          // Direct URL - fetch it
          console.log(`📥 Fetching direct URL:`, audioPath);
          const response = await fetch(audioPath);
          if (!response.ok) {
            console.error(`❌ Failed to fetch track ${i}: ${response.status} ${response.statusText}`);
            continue;
          }
          
          // Try to get extension from URL
          const ext = audioPath.split('.').pop()?.toLowerCase().split('?')[0]; // Remove query params
          if (ext && ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) {
            fileExtension = ext;
          }
          
          audioData = await response.arrayBuffer();
          console.log(`✅ Fetched ${audioData.byteLength} bytes`);
        }
        
        // Create a safe filename
        const trackTitle = track.title || `Track ${i + 1}`;
        const safeTitle = trackTitle.replace(/[<>:"/\\|?*]+/g, '_');
        const trackNumber = String(i + 1).padStart(2, '0');
        
        // Add to ZIP with track number prefix and original extension
        const fileName = `${trackNumber}. ${safeTitle}.${fileExtension}`;
        zip.file(fileName, audioData);
        
        console.log(`✅ Added to ZIP: ${fileName} (${audioData.byteLength} bytes)`);
        
      } catch (error) {
        console.error(`❌ Error processing track ${i}:`, error);
        continue;
      }
    }

    console.log(`📦 ZIP generation complete. Total files: ${Object.keys(zip.files).length}`);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Create safe album name for ZIP filename
    const albumTitle = release.title || 'Release';
    const safeAlbumTitle = albumTitle.replace(/[<>:"/\\|?*]+/g, '_');
    const zipFilename = `${safeAlbumTitle}_Tracklist.zip`;

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
