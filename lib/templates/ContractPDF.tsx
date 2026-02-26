/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// ─── Font Registration ────────────────────────────────────────────────────────
const FONTS_DIR = path.join(process.cwd(), 'node_modules/@fontsource/pt-sans/files');

Font.register({
  family: 'PTSans',
  fonts: [
    {
      src: path.join(FONTS_DIR, 'pt-sans-cyrillic-400-normal.woff'),
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    {
      src: path.join(FONTS_DIR, 'pt-sans-cyrillic-700-normal.woff'),
      fontWeight: 'bold',
      fontStyle: 'normal',
    },
    {
      src: path.join(FONTS_DIR, 'pt-sans-cyrillic-400-italic.woff'),
      fontWeight: 'normal',
      fontStyle: 'italic',
    },
  ],
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'PTSans',
    fontSize: 9,
    lineHeight: 1.45,
    paddingTop: 28,
    paddingBottom: 42,
    paddingLeft: 46,
    paddingRight: 36,
    color: '#111',
  },
  h1: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  h2: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  p: {
    marginBottom: 4,
    textAlign: 'justify',
  },
  pIndent: {
    marginBottom: 4,
    textAlign: 'justify',
    marginLeft: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  col: {
    flex: 1,
  },
  colL: {
    flex: 1,
    paddingRight: 10,
  },
  colR: {
    flex: 1,
    paddingLeft: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  divider: {
    borderBottom: '1pt solid #ccc',
    marginVertical: 8,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#555',
  },
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sigBlock: {
    width: '46%',
  },
  sigLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 9,
  },
  sigLine: {
    borderBottom: '1pt solid #111',
    width: 180,
    marginBottom: 2,
    height: 60,
    position: 'relative',
  },
  sigImg: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    width: 160,
    height: 52,
    objectFit: 'contain',
  },
  sigCaption: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#444',
  },
  // Table styles
  table: {
    width: '100%',
    marginBottom: 6,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #aaa',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1pt solid #777',
  },
  tableCell: {
    flex: 1,
    padding: 3,
    fontSize: 8,
    borderRight: '0.5pt solid #aaa',
  },
  tableCellNarrow: {
    width: 28,
    padding: 3,
    fontSize: 8,
    borderRight: '0.5pt solid #aaa',
  },
  tableCellWide: {
    flex: 2,
    padding: 3,
    fontSize: 8,
    borderRight: '0.5pt solid #aaa',
  },
  tableCellLast: {
    flex: 1,
    padding: 3,
    fontSize: 8,
  },
  royaltyHeader: {
    flex: 1.8,
    padding: 3,
    fontSize: 8,
    borderRight: '0.5pt solid #aaa',
    fontWeight: 'bold',
  },
  royaltyHeaderLast: {
    flex: 1,
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  appendixTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  rekvizit: {
    fontSize: 8.5,
    marginBottom: 3,
  },
  rekvizitLabel: {
    fontSize: 8,
    color: '#555',
    marginBottom: 1,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ContractData {
  orderId: string;
  date: string;
  country: string;
  fio: string;
  fio_tvor: string;
  nickname: string;
  releaseTitle?: string;
  tracks?: Array<{ title: string; duration: string; composer: string; lyricist: string }>;
  passport_number: string;
  passport_issued_by: string;
  passport_code: string;
  passport_date: string;
  email: string;
  bank_account: string;
  bik: string;
  corr_account: string;
  card_number: string;
}

export interface ContractPDFProps {
  data: ContractData;
  signatureBase64?: string | null;
  plotnikovSignatureBase64?: string | null;
}

// ─── Helper components ────────────────────────────────────────────────────────

const P: React.FC<{ children: React.ReactNode; indent?: boolean; noMargin?: boolean }> = ({ children, indent, noMargin }) => (
  <Text style={[indent ? s.pIndent : s.p, noMargin ? { marginBottom: 1 } : {}]}>{children}</Text>
);

// Compact inline rekvizit line: "Label: value"
const RekLine: React.FC<{ label: string; value?: string | null; bold?: boolean }> = ({ label, value, bold }) => {
  if (!value) return null;
  return (
    <Text style={{ fontSize: 8.5, marginBottom: 2.5 }}>
      <Text style={{ color: '#555' }}>{label}: </Text>
      {bold ? <Text style={s.bold}>{value}</Text> : value}
    </Text>
  );
};

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={s.sectionTitle}>{children}</Text>
);

const PageFooter: React.FC<{ page: number; total?: number; licensor: string }> = ({ page, licensor }) => (
  <Text style={s.pageFooter} fixed>
    Лицензиат  ·  {page}  ·  Лицензиар ({licensor})
  </Text>
);

interface SigProps {
  licensorFio: string;
  plotnikovSig?: string | null;
  userSig?: string | null;
}

const SignatureRow: React.FC<SigProps> = ({ licensorFio, userSig, plotnikovSig }) => (
  <View style={s.sigRow}>
    {/* Left — Licensor */}
    <View style={s.sigBlock}>
      <Text style={s.sigLabel}>Лицензиар</Text>
      <View style={s.sigLine}>
        {userSig && <Image style={s.sigImg} src={userSig} />}
      </View>
      <Text style={s.sigCaption}>/{licensorFio}/</Text>
    </View>
    {/* Right — Licensee */}
    <View style={s.sigBlock}>
      <Text style={s.sigLabel}>Лицензиат</Text>
      <Text style={[s.p, { fontSize: 8, marginBottom: 3 }]}>
        физическое лицо, применяющее специальный налоговый режим{'\n'}«Налог на профессиональный доход (НПД)»
      </Text>
      <View style={s.sigLine}>
        {plotnikovSig && <Image style={s.sigImg} src={plotnikovSig} />}
      </View>
      <Text style={s.sigCaption}>/Плотников Никита Владимирович/</Text>
    </View>
  </View>
);

// ─── Main contract pages ──────────────────────────────────────────────────────
const MainContract: React.FC<ContractPDFProps> = ({ data, signatureBase64, plotnikovSignatureBase64 }) => {
  const d = data;
  return (
    <Page size="A4" style={s.page}>
      {/* Auto page number footer fixed on every page */}
      <Text
        style={s.pageFooter}
        render={({ pageNumber }) => `Лицензиат  ·  ${pageNumber}  ·  Лицензиар (${d.fio})`}
        fixed
      />
        <Text style={s.h1}>Лицензионный договор № {d.orderId}</Text>
        <View style={s.row}>
          <Text style={s.col}>г. Ростов-на-Дону</Text>
          <Text style={{ ...s.col, textAlign: 'right' }}>{d.date}</Text>
        </View>

        <P>
          <Text style={s.bold}>Гражданин {d.country} {d.fio}</Text>, действующий от своего имени и в своем интересе, именуемый в дальнейшем «<Text style={s.bold}>Лицензиар</Text>», с одной стороны, и
        </P>
        <P>
          <Text style={s.bold}>Гражданин Российской Федерации Плотников Никита Владимирович</Text>, физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)», именуемый в дальнейшем «<Text style={s.bold}>Лицензиат</Text>», с другой стороны, именуемые совместно – «<Text style={s.bold}>Стороны</Text>», а по отдельности «<Text style={s.bold}>Сторона</Text>», составили и подписали настоящий лицензионный Договор (далее – «<Text style={s.bold}>Договор</Text>»):
        </P>

        <SectionHeader>1. Терминология</SectionHeader>
        <P indent>«<Text style={s.bold}>Произведение</Text>» – музыкальное произведение (с или без текста), являющееся объектом авторских прав.</P>
        <P indent>«<Text style={s.bold}>Исполнение</Text>» – результат исполнительской деятельности артиста, являющийся объектом смежных прав.</P>
        <P indent>«<Text style={s.bold}>Фонограмма</Text>» – любая исключительно звуковая запись исполнений или иных звуков либо их отображений, являющаяся объектом смежных прав.</P>
        <P indent>«<Text style={s.bold}>Объекты</Text>» – Произведения, Исполнения и Фонограммы, перечень которых содержится в Приложении № 2 к настоящему Договору.</P>
        <P indent>«<Text style={s.bold}>Контент</Text>» – цифровые файлы, содержащие Объекты или части Объектов (включая аудио, видео, субтитры, обложки), предназначенные для цифрового распространения.</P>
        <P indent>«<Text style={s.bold}>ЦЭР</Text>» (Цифровое Электронное Распространение) – распространение Объектов и Контента в виде цифровых файлов через сеть Интернет, включая стриминговые и загрузочные сервисы.</P>
        <P indent>«<Text style={s.bold}>Срок</Text>» – 3 (три) года с даты подписания Приложения № 2 к настоящему Договору с автоматической пролонгацией.</P>
        <P indent>«<Text style={s.bold}>Территория</Text>» – весь мир (без ограничений по территории).</P>
        <P indent>«<Text style={s.bold}>Носители</Text>» – цифровые носители и физические носители любого вида.</P>
        <P indent>«<Text style={s.bold}>Исходный материал</Text>» – мастер-записи Объектов надлежащего технического качества, передаваемые Лицензиаром Лицензиату.</P>

        <SectionHeader>2. Предмет Договора</SectionHeader>
        <P>2.1. Лицензиар предоставляет Лицензиату на Срок, на Территории, за вознаграждение, исключительную лицензию, включающую право осуществлять следующие способы использования Объектов самостоятельно или с привлечением третьих лиц, в т.ч. через сублицензирование:</P>

        <P indent>«<Text style={s.bold}>Цифровое электронное распространение (ЦЭР)</Text>»</P>
        <P indent>2.1.1. Перерабатывать Объекты, в том числе технически, в следующих целях: перерабатывать в целях создания Контента (в т.ч. Караоке) и рекламного материала; путём конвертации в любые известные цифровые форматы; изменять длительность Объектов для фрагментарного использования.</P>
        <P indent>2.1.2. Воспроизводить экземпляры Объектов в любом формате на Носителях без ограничения по тиражу, а также в памяти ЭВМ и иных технических устройств (мобильных телефонов, смартфонов и пр.).</P>
        <P indent>2.1.3. Распространять экземпляры Объектов путем продажи или иного отчуждения экземпляров, в том числе способом Цифрового Электронного распространения (стриминг).</P>
        <P indent>2.1.4. Доводить Объекты до всеобщего сведения таким образом, что любое лицо может получить к ним доступ из любого места и в любое время по собственному выбору, в т.ч. через сеть Интернет.</P>

        <P indent>«<Text style={s.bold}>Механические права</Text>»</P>
        <P indent>2.1.5. Воспроизводить Объекты на Носителях; распространять экземпляры Объектов на Носителях, в том числе продавать или иным образом отчуждать; сдавать в прокат экземпляры Объектов; импортировать оригиналы или экземпляры Объектов в целях распространения.</P>


        <P indent>«<Text style={s.bold}>Публичные права</Text>»</P>
        <P indent>2.1.6. Публично показывать Объекты и/или публично исполнять Объекты с помощью технических средств или в живом исполнении в месте, открытом для свободного посещения.</P>
        <P indent>2.1.7. Сообщать Объекты в эфир, в том числе через спутник, по радио или телевидению; сообщать Объекты по кабелю, проводу, оптическому волокну или аналогичным средствам, включая ретрансляцию.</P>
        <P indent>2.1.8. Получать вознаграждения авторов, исполнителей за свободное воспроизведение фонограмм в личных целях (ст. 1245 ГК РФ), вознаграждение авторов Произведений при публичном исполнении аудиовизуального произведения (ст. 1263 ГК РФ), а также вознаграждение исполнителей за публичное исполнение Фонограммы (ст. 1326 ГК РФ).</P>

        <P indent>«<Text style={s.bold}>Синхронизация</Text>»</P>
        <P indent>2.1.9. Включать Объекты в составные произведения, альбомы, сборники; включать Объекты в состав аудиовизуальных произведений, в том числе создаваемых для рекламы.</P>

        <P>2.2. Лицензиар разрешает Лицензиату и его сублицензиатам обнародовать Объекты любыми из перечисленных способов, самостоятельно решать указывать или нет имя/псевдоним авторов/исполнителей (право на анонимное использование).</P>
        <P>2.3. Лицензиар настоящим даёт Лицензиату согласие на предоставление третьим лицам прав, полученных по Договору (право на сублицензирование).</P>
        <P>2.4. Право использования Объектов считается предоставленным с даты подписания Сторонами соответствующего Приложения к Договору.</P>
        <P>2.5. Лицензиар выражает согласие со внесением Лицензиатом изменений, сокращений и дополнений в Объекты, снабжением их иллюстрациями, предисловием, комментариями.</P>

        <SectionHeader>3. Права и обязанности Сторон</SectionHeader>
        <P>3.1. Лицензиар обязуется:</P>
        <P indent>3.1.1. В момент подписания соответствующего Приложения к Договору передать Лицензиату Исходные материалы;</P>
        <P indent>3.1.2. В течение Срока на Территории не предоставлять третьим лицам право использования Объектов способами, предоставленными Лицензиату по настоящему Договору;</P>
        <P indent>3.1.3. Урегулировать любые претензии обладателей исключительных прав на Объекты, связанные с использованием Объектов.</P>
        <P>3.2. Лицензиар вправе требовать от Лицензиата своевременной выплаты вознаграждения за предоставляемые по настоящему Договору права.</P>
        <P>3.3. Лицензиат обязуется:</P>
        <P indent>3.3.1. Использовать Объекты исключительно способами и на условиях, предусмотренных настоящим Договором;</P>
        <P indent>3.3.2. Выплачивать Лицензиару вознаграждение в размере, порядке и в срок, предусмотренные разделом 4 настоящего Договора;</P>
        <P indent>3.3.3. Предоставлять Лицензиару отчеты об использовании Объектов в порядке, указанном в Финансовом соглашении.</P>
        <P>3.4. Лицензиат вправе:</P>
        <P indent>3.4.1. Самостоятельно использовать Объекты способами и на условиях, предусмотренных настоящим Договором;</P>
        <P indent>3.4.2. Предоставлять полученные по настоящему Договору права любым третьим лицам путем выдачи сублицензий;</P>
        <P indent>3.4.3. При использовании Объектов указывать свое наименование и/или логотип, наименования партнеров и спонсоров.</P>

        <SectionHeader>4. Вознаграждение Лицензиара</SectionHeader>
        <P>4.1. За предоставление права использования Объектов Лицензиат обязуется выплачивать Лицензиару вознаграждение в размере, в порядке и в сроки, указанные в Финансовом соглашении к настоящему Договору.</P>
        <P>4.2. Все расчеты производятся путем перечисления денежных средств в российских рублях на банковский/расчетный счет Лицензиара, указанный в реквизитах Договора.</P>

        <SectionHeader>5. Гарантии Лицензиара</SectionHeader>
        <P>5.1. Лицензиар является законным обладателем исключительных прав на Объекты и вправе распоряжаться такими правами.</P>
        <P>5.2. На момент подписания не существует никаких прав, обременений и требований третьих лиц в отношении каждого из Объектов.</P>
        <P>5.3. Исключительные права на Объекты не находятся в управлении (коллективном или доверительном) согласно способам использования по п. 2.1., права не заложены, не состоят под арестом.</P>
        <P>5.4. Заключение настоящего Договора не нарушает законных прав третьих лиц.</P>
        <P>5.5. Лицензиар гарантирует, что не выдавал третьим лицам исключительных лицензий в пределах, установленных Договором.</P>


        <SectionHeader>6. Ответственность Сторон</SectionHeader>
        <P>6.1. За неисполнение или ненадлежащее исполнение обязательств по Договору Стороны несут ответственность в соответствии с действующим законодательством Российской Федерации и Договором.</P>
        <P>6.2. В случае возникновения разногласий Стороны будут стараться разрешить их путем переговоров. Если в течение 30 (тридцати) календарных дней разногласие не урегулировано, спор подлежит разрешению в Арбитражном суде г. Москвы (договорная подсудность).</P>
        <P>6.3. Приложениями и дополнительными соглашениями могут быть предусмотрены дополнительные меры ответственности.</P>
        <P>6.4. Применимое право по настоящему Договору – законодательство Российской Федерации.</P>

        <SectionHeader>7. Срок действия Договора</SectionHeader>
        <P>7.1. Договор вступает в силу с момента его подписания Сторонами и действует до полного исполнения Сторонами своих обязательств. Срок действия настоящего Договора считается автоматически продленным на каждый последующий календарный год при условии отсутствия уведомления об ином не менее чем за 90 (девяносто) рабочих дней до истечения срока.</P>
        <P>7.2. Настоящий Договор может быть расторгнут Лицензиатом досрочно в одностороннем порядке в случаях, предусмотренных действующим законодательством РФ.</P>

        <SectionHeader>8. Заключительные положения</SectionHeader>
        <P>8.1. Условия настоящего Договора, а также иная информация, предоставляемая Сторонами в ходе его исполнения, является конфиденциальной.</P>
        <P>8.2. Слова во множественном числе означают также единственное число, и наоборот, в зависимости от контекста.</P>
        <P>8.3. Если какое-либо из положений настоящего Договора окажется ничтожным, остальные положения останутся в силе.</P>
        <P>8.4. Перемена Стороны осуществляется только на основании предварительного письменного согласия второй Стороны.</P>
        <P>8.5. Все изменения и дополнения к Договору действительны, если они должным образом подписаны уполномоченными представителями Сторон.</P>
        <P>8.6. Стороны должны сообщать друг другу об изменении адресов, банковских реквизитов.</P>
        <P>8.7. Стороны признают юридическую силу документов, направленных в мессенджерах, социальных сетях, а также по адресу электронной почты, указанным в п. 9 Договора.</P>
        <P>8.8. В удостоверение своего согласия Стороны заключили настоящий Договор в двух оригинальных экземплярах, имеющих одинаковую юридическую силу, по одному для каждой из Сторон.</P>

      <View break>
        <SectionHeader>9. Адреса, реквизиты и подписи Сторон</SectionHeader>

        <View style={[s.row, { marginTop: 6 }]}>
          {/* Licensor */}
          <View style={s.colL}>
            <Text style={[s.rekvizit, s.bold, { marginBottom: 4 }]}>Лицензиар</Text>
            <RekLine label="Гражданин" value={`${d.country} ${d.fio}`} bold />
            <RekLine label="Паспорт (серия и номер)" value={d.passport_number} />
            <RekLine label="Кем выдан" value={d.passport_issued_by} />
            <RekLine label="Код подразделения" value={d.passport_code} />
            <RekLine label="Дата выдачи" value={d.passport_date} />
            <RekLine label="E-mail" value={d.email} />
            {(d.bank_account || d.bik || d.corr_account || d.card_number) && (
              <Text style={[s.rekvizit, s.bold, { marginTop: 5, marginBottom: 2 }]}>Банковские реквизиты:</Text>
            )}
            <RekLine label="Номер счёта" value={d.bank_account} />
            <RekLine label="БИК" value={d.bik} />
            <RekLine label="Корр. счёт" value={d.corr_account} />
            <RekLine label="Номер карты" value={d.card_number} />
          </View>
          {/* Licensee */}
          <View style={s.colR}>
            <Text style={[s.rekvizit, s.bold, { marginBottom: 4 }]}>Лицензиат</Text>
            <Text style={{ fontSize: 8.5, marginBottom: 4 }}>
              Гражданин Российской Федерации{`\n`}Плотников Никита Владимирович{`\n`}физ. лицо, применяющее спец. налоговый режим НПД
            </Text>
            <RekLine label="Паспорт" value="6024 816315" />
            <RekLine label="Кем выдан" value="ГУ МВД РОССИИ ПО РОСТОВСКОЙ ОБЛАСТИ" />
            <RekLine label="Дата выдачи" value="24.07.2024" />
            <RekLine label="Код подразделения" value="610-009" />
            <RekLine label="Дата рождения" value="23.06.2004" />
            <RekLine label="ИНН" value="615531925831" />
            <RekLine label="Email" value="thqlabel@ya.ru" />
            <Text style={[s.rekvizit, s.bold, { marginTop: 5, marginBottom: 2 }]}>Банковские реквизиты:</Text>
            <RekLine label="БИК" value="044525593" />
            <RekLine label="Номер счёта" value="40817810705892387715" />
          </View>
        </View>

        <SignatureRow
          licensorFio={d.fio}
          userSig={signatureBase64 ?? null}
          plotnikovSig={plotnikovSignatureBase64 ?? null}
        />

      </View>
    </Page>
  );
};

// ─── Appendix 1 — Financial Agreement ────────────────────────────────────────
const Appendix1: React.FC<ContractPDFProps> = ({ data, signatureBase64, plotnikovSignatureBase64 }) => {
  const d = data;
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.appendixTitle}>
        Приложение № 1 к Лицензионному договору № {d.orderId} от {d.date}
      </Text>
      <Text style={s.h2}>Финансовое соглашение</Text>
      <View style={s.row}>
        <Text style={s.col}>г. Ростов-на-Дону</Text>
        <Text style={{ ...s.col, textAlign: 'right' }}>{d.date}</Text>
      </View>

      <P>
        <Text style={s.bold}>Гражданин {d.country} {d.fio}</Text>, действующий от своего имени и в своем интересе, именуемый в дальнейшем «<Text style={s.bold}>Лицензиар</Text>», с одной стороны, и
      </P>
      <P>
        <Text style={s.bold}>Гражданин Российской Федерации Плотников Никита Владимирович</Text>, физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)», именуемый в дальнейшем «<Text style={s.bold}>Лицензиат</Text>», с другой стороны, составили и подписали настоящее Финансовое соглашение (далее – «<Text style={s.bold}>Соглашение</Text>») о нижеследующем:
      </P>

      <SectionHeader>1. Терминология</SectionHeader>
      <P indent>«<Text style={s.bold}>Цифровая дистрибуция</Text>» – использование Объектов способами, указанными в п. 2.1.1.–2.1.4. Договора.</P>
      <P indent>«<Text style={s.bold}>Механические права</Text>» – использование Объектов способами, указанными в п. 2.1.5. Договора.</P>
      <P indent>«<Text style={s.bold}>Публичные права</Text>» – использование Объектов способами, указанными в п. 2.1.6.–2.1.8. Договора.</P>
      <P indent>«<Text style={s.bold}>Синхронизация</Text>» – использование Объектов способами, указанными в п. 2.1.9. Договора.</P>
      <P indent>«<Text style={s.bold}>Доход Лицензиата</Text>» – сумма финансовых поступлений (выручки) за вычетом применимых налогов, фактически полученная Лицензиатом от использования Объектов путём Цифровой дистрибуции, Механических прав, Публичных прав и Синхронизации.</P>
      <P indent>«<Text style={s.bold}>Отчётный период</Text>» – календарный квартал года.</P>
      <P indent>«<Text style={s.bold}>Отчёт</Text>» – печатный и/или электронный документ, содержащий информацию о размере вознаграждения (Роялти), подлежащего выплате за Отчетный период.</P>

      <SectionHeader>2. Размер вознаграждения (Роялти)</SectionHeader>
      <P>2.1. Лицензиат выплачивает Лицензиару Роялти в следующем размере:</P>

      {/* Royalty table */}
      <View style={s.table}>
        <View style={s.tableRowHeader}>
          <View style={s.royaltyHeader}><Text>Способы использования</Text></View>
          <View style={s.royaltyHeader}><Text>Роялти при реализации авторских прав (Произведений)</Text></View>
          <View style={s.royaltyHeaderLast}><Text>Роялти при реализации смежных прав (Исполнений и Фонограмм)</Text></View>
        </View>
        {[
          ['Цифровая дистрибуция', '80%', '80%'],
          ['Механические права', '80%', '80%'],
          ['Публичные права', '80%', '80%'],
          ['Синхронизация', '80%', '80%'],
        ].map((row, i) => (
          <View style={s.tableRow} key={i}>
            <View style={s.royaltyHeader}><Text>{row[0]}</Text></View>
            <View style={s.royaltyHeader}><Text style={{ textAlign: 'center' }}>{row[1]}</Text></View>
            <View style={s.royaltyHeaderLast}><Text style={{ textAlign: 'center' }}>{row[2]}</Text></View>
          </View>
        ))}
      </View>

      <SectionHeader>3. Порядок предоставления отчётов</SectionHeader>
      <P>3.1. Не позднее 45 (сорока пяти) календарных дней после окончания очередного Отчетного периода, Лицензиат направляет Лицензиару на электронный адрес, указанный в реквизитах Договора, Отчет в форме файла в формате excel, word, pdf или в ином формате.</P>
      <P>3.2. В течение 5 (пяти) календарных дней с даты получения Отчета Лицензиар рассматривает его и направляет подписанный Отчет либо мотивированный отказ. В случае отсутствия ответа Лицензиара по истечении указанного срока, Отчет считается принятым.</P>
      <P>3.3. Стороны договорились, что Лицензиар может выразить согласие с Отчетом в иной форме, в том числе в переписке по электронной почте или в мессенджере.</P>

      <SectionHeader>4. Порядок выплаты вознаграждения</SectionHeader>
      <P>4.1. В срок не позднее 5 (пяти) календарных дней с момента получения Лицензиатом подписанного Отчета, Лицензиат выплачивает Лицензиару суммы вознаграждения, причитающиеся к выплате на основании Отчётов.</P>
      <P>4.2. Выплата вознаграждения будет производиться с учётом фактических расходов Лицензиата по выплате вознаграждения третьим лицам – соавторам Объектов.</P>

      <P>5. Стороны признают юридическую силу документов, направленных по адресу электронной почты, в соответствии с положениями настоящего Соглашения.</P>
      <P>6. Настоящее Соглашение вступает в силу с даты его подписания и действует в течение срока действия Договора.</P>
      <P>7. Настоящее Соглашение является неотъемлемой частью Договора, составлено в 2 (двух) идентичных экземплярах, по одному для каждой из Сторон.</P>

      <SectionHeader>Подписи Сторон</SectionHeader>
      <SignatureRow
        licensorFio={d.fio}
        userSig={signatureBase64 ?? null}
        plotnikovSig={plotnikovSignatureBase64 ?? null}
      />
    </Page>
  );
};

// ─── Appendix 2 — Object list ─────────────────────────────────────────────────
const Appendix2: React.FC<ContractPDFProps> = ({ data, signatureBase64, plotnikovSignatureBase64 }) => {
  const d = data;
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.appendixTitle}>
        Приложение № 2 к Лицензионному договору № {d.orderId} от {d.date}
      </Text>

      <View style={s.row}>
        <Text style={s.col}>г. Ростов-на-Дону</Text>
        <Text style={{ ...s.col, textAlign: 'right' }}>{d.date}</Text>
      </View>

      <P>
        <Text style={s.bold}>Гражданин {d.country} {d.fio}</Text>, действующий от своего имени и в своем интересе, именуемый в дальнейшем «<Text style={s.bold}>Лицензиар</Text>», с одной стороны, и
      </P>
      <P>
        <Text style={s.bold}>Гражданин Российской Федерации Плотников Никита Владимирович</Text>, физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)», именуемый в дальнейшем «<Text style={s.bold}>Лицензиат</Text>», с другой стороны, составили и подписали настоящее Приложение к Договору о нижеследующем:
      </P>

      <P>1. Лицензиар предоставляет Лицензиату на Территорию и на Срок право использования следующих Объектов:</P>

      {/* Track table */}
      <View style={s.table}>
        <View style={s.tableRowHeader}>
          <View style={s.tableCellNarrow}><Text style={s.bold}>№</Text></View>
          <View style={s.tableCellWide}><Text style={s.bold}>Название Произведения</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Длительность</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Автор музыки</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Автор слов</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Исполнители</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Изготовитель Фонограммы</Text></View>
          <View style={s.tableCellLast}><Text style={s.bold}>Срок лицензии</Text></View>
        </View>
        {/* Dynamic track rows — from actual tracklist, or 3 empty rows as fallback */}
        {(d.tracks && d.tracks.length > 0 ? d.tracks : [
          { title: d.releaseTitle || '-', duration: '-', composer: '-', lyricist: '-' },
          { title: '-', duration: '-', composer: '-', lyricist: '-' },
          { title: '-', duration: '-', composer: '-', lyricist: '-' },
        ]).map((t, i) => (
          <View style={s.tableRow} key={i}>
            <View style={s.tableCellNarrow}><Text>{i + 1}</Text></View>
            <View style={s.tableCellWide}><Text>{t.title || '-'}</Text></View>
            <View style={s.tableCell}><Text>{t.duration || '-'}</Text></View>
            <View style={s.tableCell}><Text>{t.composer || '-'}</Text></View>
            <View style={s.tableCell}><Text>{t.lyricist || '-'}</Text></View>
            <View style={s.tableCell}><Text>{d.nickname || '-'}</Text></View>
            <View style={s.tableCell}><Text>{d.nickname || '-'}</Text></View>
            <View style={s.tableCellLast}><Text>3 года</Text></View>
          </View>
        ))}
      </View>

      <P>2. Лицензиат подтверждает, что получил Исходный материал надлежащего технического качества, посредством Интернет-передачи через FTP-протокол.</P>
      <P>3. Настоящее Приложение вступает в силу с даты, указанной в преамбуле, и действует в течение Срока. Срок лицензии считается автоматически продленным при условии отсутствия уведомления об ином не менее чем за 90 (девяносто) рабочих дней до истечения срока.</P>
      <P>4. Настоящее Приложение является неотъемлемой частью Договора, составлено в 2 (двух) экземплярах по одному для каждой из Сторон.</P>

      <SectionHeader>Подписи Сторон</SectionHeader>
      <SignatureRow
        licensorFio={d.fio}
        userSig={signatureBase64 ?? null}
        plotnikovSig={plotnikovSignatureBase64 ?? null}
      />
    </Page>
  );
};

// ─── Appendix 3 — Report form ─────────────────────────────────────────────────
const Appendix3: React.FC<ContractPDFProps> = ({ data, signatureBase64, plotnikovSignatureBase64 }) => {
  const d = data;
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.appendixTitle}>
        Приложение № 3 к Лицензионному договору № {d.orderId} от {d.date}
      </Text>

      <P>
        <Text style={s.bold}>Гражданин {d.country} {d.fio}</Text>, именуемый «<Text style={s.bold}>Лицензиар</Text>», и
        {' '}<Text style={s.bold}>Гражданин Российской Федерации Плотников Никита Владимирович</Text>, именуемый «<Text style={s.bold}>Лицензиат</Text>», составили форму отчёта о нижеследующем:
      </P>

      <Text style={s.h2}>ФОРМА ОТЧЁТА</Text>
      <Text style={[s.p, { textAlign: 'center' }]}>
        Отчёт об использовании Объектов{'\n'}
        за период с «___» ________ 20__ г. по «___» ________ 20__ г.
      </Text>

      {/* Report table */}
      <View style={s.table}>
        <View style={s.tableRowHeader}>
          <View style={s.tableCellNarrow}><Text style={s.bold}>№</Text></View>
          <View style={s.tableCellWide}><Text style={s.bold}>Название</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Автор музыки</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Автор текста</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Исполнитель</Text></View>
          <View style={s.tableCell}><Text style={s.bold}>Доход Лицензиата</Text></View>
          <View style={s.tableCellLast}><Text style={s.bold}>Вознаграждение Лицензиара</Text></View>
        </View>
        {/* Empty rows */}
        {[1, 2, 3].map((i) => (
          <View style={{ ...s.tableRow, minHeight: 18 }} key={i}>
            <View style={s.tableCellNarrow}><Text>{i}</Text></View>
            <View style={s.tableCellWide}><Text> </Text></View>
            <View style={s.tableCell}><Text> </Text></View>
            <View style={s.tableCell}><Text> </Text></View>
            <View style={s.tableCell}><Text> </Text></View>
            <View style={s.tableCell}><Text> </Text></View>
            <View style={s.tableCellLast}><Text> </Text></View>
          </View>
        ))}
      </View>

      <P>Вознаграждение Лицензиара за период составляет: ________________________</P>

      <SectionHeader>Подписи Сторон</SectionHeader>
      <SignatureRow
        licensorFio={d.fio}
        userSig={signatureBase64 ?? null}
        plotnikovSig={plotnikovSignatureBase64 ?? null}
      />
    </Page>
  );
};

// ─── Root Document export ─────────────────────────────────────────────────────
const ContractPDF: React.FC<ContractPDFProps> = (props) => (
  <Document
    title={`Лицензионный договор № ${props.data.orderId}`}
    author="THQ Label"
    subject="Лицензионный договор"
  >
    <MainContract {...props} />
    <Appendix1 {...props} />
    <Appendix2 {...props} />
    <Appendix3 {...props} />
  </Document>
);

export default ContractPDF;
