// 中医知识库（智能体内置知识模块）
// 分类：formula 经典方剂 / herb 本草 / acupoint 穴位经络 / diet 养生食疗 / classic 名医典籍
import type { LocaleText } from '@/types'

export type KnowledgeCategory = 'formula' | 'herb' | 'acupoint' | 'diet' | 'classic'

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  title: LocaleText
  summary: LocaleText
  tags: string[]
}

const L = (zh: string, en: string, ja: string, ko: string, es: string, fr: string): LocaleText => ({ zh, en, ja, ko, es, fr })

export const TCM_KNOWLEDGE: KnowledgeEntry[] = [
  // ===== 经典方剂 =====
  {
    id: 'f_guizhi',
    category: 'formula',
    title: L('桂枝汤', 'Guizhi Decoction', '桂枝湯', '계지탕', 'Decocción Guizhi', 'Décoction Guizhi'),
    summary: L(
      '《伤寒论》第一方，解肌发表、调和营卫。主治外感风寒表虚证：发热、恶风、汗出、脉浮缓。被誉为“群方之冠”，后世众多方剂由此化裁。',
      'The first formula in Shanghan Lun: releases the exterior and harmonizes Ying-Wei. For wind-cold with sweating and floating slow pulse. Known as the "chief of all formulas".',
      '傷寒論の第一方。解肌発表・営衛調和。外感風寒表虚証に用いる。',
      '상한론 제일 방제. 해기발표·영위조화.',
      'Primera fórmula del Shanghan Lun: libera el exterior y armoniza Ying-Wei.',
      'Première formule du Shanghan Lun : libère l\u2019extérieur et harmonise Ying-Wei.',
    ),
    tags: ['伤寒论', '解表剂', '风寒'],
  },
  {
    id: 'f_sijunzi',
    category: 'formula',
    title: L('四君子汤', 'Sijunzi Decoction', '四君子湯', '사군자탕', 'Decocción Sijunzi', 'Décoction Sijunzi'),
    summary: L(
      '补气健脾基础方，由人参、白术、茯苓、甘草组成。主治脾胃气虚：食少便溏、气短乏力、面色萎白。为补气诸方之祖。',
      'The foundational qi-tonifying formula (Ginseng, Atractylodes, Poria, Licorice) for spleen-stomach qi deficiency with poor appetite and fatigue.',
      '補気健脾の基礎方。脾胃気虚に用いる。',
      '보기건비의 기초 방제.',
      'Fórmula base para tonificar el qi de bazo-estómago.',
      'Formule de base pour tonifier le qi de la rate-estomac.',
    ),
    tags: ['补气', '脾胃', '基础方'],
  },
  {
    id: 'f_liuwei',
    category: 'formula',
    title: L('六味地黄丸', 'Liuwei Dihuang Pill', '六味地黄丸', '육미지황환', 'Píldora Liuwei Dihuang', 'Pilule Liuwei Dihuang'),
    summary: L(
      '滋补肾阴代表方，三补三泻：熟地、山萸、山药补肝脾肾，泽泻、丹皮、茯苓渗湿泻火。主治肾阴亏损：腰膝酸软、头晕耳鸣、盗汗遗精。',
      'The representative kidney-yin nourishing formula with "three tonics and three drains". For sore lower back, tinnitus, night sweats due to kidney yin deficiency.',
      '腎陰を滋補する代表方。三補三瀉の構成。',
      '신음을 자보하는 대표 방제.',
      'Fórmula representativa para nutrir el yin de riñón.',
      'Formule représentative pour nourrir le yin du rein.',
    ),
    tags: ['补肾阴', '滋阴', '虚证'],
  },
  {
    id: 'f_xiaoyao',
    category: 'formula',
    title: L('逍遥散', 'Xiaoyao Powder', '逍遙散', '소요산', 'Polvo Xiaoyao', 'Poudre Xiaoyao'),
    summary: L(
      '疏肝解郁、养血健脾。主治肝郁血虚脾弱证：两胁作痛、情绪抑郁、月经不调、乳房胀痛。现代常用于情绪压力相关调理。',
      'Soothes liver qi stagnation, nourishes blood and strengthens spleen. For mood depression, hypochondriac pain and irregular menstruation.',
      '疏肝解鬱・養血健脾。肝鬱血虚脾弱証に用いる。',
      '소간해울·양혈건비.',
      'Calma el estancamiento de qi de hígado y nutre la sangre.',
      'Apaise la stagnation du qi du foie et nourrit le sang.',
    ),
    tags: ['疏肝', '解郁', '情志'],
  },
  {
    id: 'f_bazhen',
    category: 'formula',
    title: L('八珍汤', 'Bazhen Decoction', '八珍湯', '팔진탕', 'Decocción Bazhen', 'Décoction Bazhen'),
    summary: L(
      '四君子汤合四物汤，气血双补。主治气血两虚：面色苍白、气短懒言、心悸怔忡、月经量少色淡。',
      'Combines Sijunzi and Siwu — tonifies both qi and blood. For pale complexion, palpitations and scanty menstruation.',
      '四君子湯と四物湯の合方。気血双補。',
      '사군자탕과 사물탕의 합방. 기혈쌍보.',
      'Tonifica qi y sangre a la vez.',
      'Tonifie à la fois le qi et le sang.',
    ),
    tags: ['气血双补', '虚劳'],
  },
  {
    id: 'f_yinqiao',
    category: 'formula',
    title: L('银翘散', 'Yinqiao Powder', '銀翹散', '은교산', 'Polvo Yinqiao', 'Poudre Yinqiao'),
    summary: L(
      '辛凉解表、清热解毒。主治温病初起：发热、微恶风寒、咽喉肿痛、口渴。为风热感冒常用方。',
      'Cool and acrid exterior-releasing, clears heat and detoxifies. For early wind-heat illness with sore throat and fever.',
      '辛涼解表・清熱解毒。温病初期に用いる。',
      '신량해표·청열해독.',
      'Libera el exterior fresco y picante, depura el calor.',
      'Libère l\u2019extérieur frais et âcre, purge la chaleur.',
    ),
    tags: ['风热感冒', '温病', '清热'],
  },

  // ===== 本草 =====
  {
    id: 'h_rensen',
    category: 'herb',
    title: L('人参', 'Ginseng (Renshen)', '人参', '인삼', 'Ginseng', 'Ginseng'),
    summary: L(
      '大补元气、复脉固脱、补脾益肺、生津安神。主治元气虚脱、脾虚食少、肺虚喘咳、心悸失眠。反藜芦，畏五灵脂。',
      'Greatly tonifies original qi, rescues collapse, benefits spleen and lung, generates fluids and calms the spirit.',
      '大補元気・復脈固脱・補脾益肺。',
      '대보원기·보脾익폐.',
      'Tonifica enormemente el qi original.',
      'Tonifie fortement le qi originel.',
    ),
    tags: ['补气', '百草之王', '微温'],
  },
  {
    id: 'h_huangqi',
    category: 'herb',
    title: L('黄芪', 'Astragalus (Huangqi)', '黄耆', '황기', 'Astrágalo', 'Astragale'),
    summary: L(
      '补气升阳、固表止汗、利水消肿、托毒生肌。主治气虚乏力、自汗浮肿、久溃不敛。日常可泡水代茶（每次10-15g）。',
      'Tonifies qi, raises yang, consolidates the exterior, stops sweating, promotes urination and heals wounds.',
      '補気昇陽・固表止汗・利水消腫。',
      '보기승양·고표지한.',
      'Tonifica el qi y eleva el yang.',
      'Tonifie le qi et élève le yang.',
    ),
    tags: ['补气', '固表', '泡茶'],
  },
  {
    id: 'h_gouqi',
    category: 'herb',
    title: L('枸杞子', 'Goji Berry (Gouqizi)', '枸杞子', '구기자', 'Bayas Goji', 'Baies de Goji'),
    summary: L(
      '滋补肝肾、益精明目。主治肝肾阴虚：腰膝酸软、眩晕耳鸣、目昏多泪、消渴。可干嚼、泡水或入粥（每日10g左右）。',
      'Nourishes liver and kidney, benefits essence and brightens eyes. For dizziness, tinnitus and blurry vision.',
      '滋補肝腎・益精明目。',
      '자보간신·익정명목.',
      'Nutre hígado y riñón, mejora la vista.',
      'Nourrit foie et rein, améliore la vue.',
    ),
    tags: ['药食同源', '明目', '滋阴'],
  },
  {
    id: 'h_chenhua',
    category: 'herb',
    title: L('陈皮', 'Dried Tangerine Peel (Chenpi)', '陳皮', '진피', 'Cáscara de mandarina', 'Écorce de mandarine'),
    summary: L(
      '理气健脾、燥湿化痰。主治脘腹胀满、食少吐泻、咳嗽痰多。越陈者良，与半夏配伍名“二陈”。',
      'Regulates qi, strengthens spleen, dries dampness and transforms phlegm. For abdominal distension and copious sputum.',
      '理気健脾・燥湿化痰。',
      '이기건비·조습화담.',
      'Regula el qi y transforma la flema.',
      'Régule le qi et transforme les glaires.',
    ),
    tags: ['理气', '化痰', '药食同源'],
  },
  {
    id: 'h_danggui',
    category: 'herb',
    title: L('当归', 'Angelica Root (Danggui)', '当帰', '당귀', 'Raíz de Angélica', 'Angélique chinoise'),
    summary: L(
      '补血活血、调经止痛、润肠通便。主治血虚萎黄、月经不调、经闭痛经、肠燥便秘。被誉为“妇科圣药”。',
      'Tonifies and moves blood, regulates menstruation, relieves pain and moistens intestines. The "sacred herb for gynecology".',
      '補血活血・調経止痛。',
      '보혈활혈·조경지통.',
      'Tonifica y mueve la sangre, regula la menstruación.',
      'Tonifie et fait circuler le sang, règle les règles.',
    ),
    tags: ['补血', '调经', '妇科'],
  },
  {
    id: 'h_fuling',
    category: 'herb',
    title: L('茯苓', 'Poria (Fuling)', '茯苓', '복령', 'Poria', 'Poria'),
    summary: L(
      '利水渗湿、健脾宁心。主治水肿尿少、痰饮眩悸、脾虚食少、心神不安。性平不伤正，湿气重者常用。',
      'Promotes urination, drains dampness, strengthens spleen and calms the mind. Neutral nature, safe for long-term use.',
      '利水滲湿・健脾寧心。',
      '이수삼습·건비영심.',
      'Promueve la diuresis y calma la mente.',
      'Favorise la diurèse et apaise l\u2019esprit.',
    ),
    tags: ['祛湿', '健脾', '安神'],
  },

  // ===== 穴位经络 =====
  {
    id: 'a_zusanli',
    category: 'acupoint',
    title: L('足三里（ST36）', 'Zusanli ST-36', '足三里（ST36）', '족삼리（ST36）', 'Zusanli ST-36', 'Zusanli ST-36'),
    summary: L(
      '胃经合穴，位于犊鼻下3寸。“肚腹三里留”——健脾和胃、扶正培元第一保健穴。每日按揉5分钟或艾灸10-15分钟。',
      'The premier health-preservation point, 3 cun below the kneecap. Strengthens spleen-stomach and boosts immunity.',
      '胃経の合穴。健脾和胃・扶正培元の第一大保健穴。',
      '위경 합혈. 건비화위 제1보건혈.',
      'El punto principal de salud: fortalece bazo-estómago.',
      'Le point santé par excellence : renforce rate-estomac.',
    ),
    tags: ['保健穴', '脾胃', '艾灸'],
  },
  {
    id: 'a_neiguan',
    category: 'acupoint',
    title: L('内关（PC6）', 'Neiguan PC-6', '内関（PC6）', '내관（PC6）', 'Neiguan PC-6', 'Neiguan PC-6'),
    summary: L(
      '心包经络穴，腕横纹上2寸。宁心安神、理气止痛、和胃止呕。晕车心悸时按压即刻缓解。',
      '2 cun above wrist crease. Calms the heart, relieves nausea and motion sickness rapidly.',
      '心包経の絡穴。寧心安神・和胃止嘔。',
      '심포경 낙혈. 영심안신·화위지구.',
      'Calma el corazón y alivia las náuseas.',
      'Calme le cœur et soulage les nausées.',
    ),
    tags: ['止呕', '心悸', '晕车'],
  },
  {
    id: 'a_hegu',
    category: 'acupoint',
    title: L('合谷（LI4）', 'Hegu LI-4', '合谷（LI4）', '합곡（LI4）', 'Hegu LI-4', 'Hegu LI-4'),
    summary: L(
      '大肠经原穴，手背第1、2掌骨间。“面口合谷收”——主治头痛、牙痛、面口疾患。孕妇慎用。',
      'Between thumb and index metacarpals. The classic point for headache, toothache and facial disorders. Caution in pregnancy.',
      '大腸経の原穴。頭痛・歯痛・顔面疾患に用いる。妊婦注意。',
      '대장경 원혈. 두통·치통·안면질환.',
      'Punto clásico para cefalea y dolor dental.',
      'Point classique pour céphalées et douleurs dentaires.',
    ),
    tags: ['止痛', '头面', '四总穴'],
  },
  {
    id: 'a_sanyinjiao',
    category: 'acupoint',
    title: L('三阴交（SP6）', 'Sanyinjiao SP-6', '三陰交（SP6）', '삼음교（SP6）', 'Sanyinjiao SP-6', 'Sanyinjiao SP-6'),
    summary: L(
      '肝脾肾三经交会穴，内踝尖上3寸。调补肝脾肾、理血调经。妇科调理要穴，睡前艾灸助眠。孕妇禁用。',
      'Meeting point of liver, spleen and kidney channels. Key point for gynecological regulation. Contraindicated in pregnancy.',
      '肝脾腎三経の交会穴。婦人科調理の要穴。',
      '간비신 삼경 교회혈.',
      'Punto clave para regulación ginecológica.',
      'Point clé de régulation gynécologique.',
    ),
    tags: ['妇科', '调经', '助眠'],
  },
  {
    id: 'a_yongquan',
    category: 'acupoint',
    title: L('涌泉（KI1）', 'Yongquan KI-1', '湧泉（KI1）', '용천（KI1）', 'Yongquan KI-1', 'Yongquan KI-1'),
    summary: L(
      '肾经井穴，足底前1/3凹陷处。滋阴降火、引火归元。睡前搓涌泉100下（“搓脚心”），改善失眠与虚火上炎。',
      'The lowest point of the body, on the sole. Drains rising fire and treats insomnia. Rub 100 times before bed.',
      '腎経の井穴。滋陰降火・引火帰元。',
      '신경 정혈. 자음강화.',
      'Drena el fuego ascendente y trata el insomnio.',
      'Draine le feu ascendant, traite l\u2019insomnie.',
    ),
    tags: ['失眠', '降火', '睡前保健'],
  },
  {
    id: 'a_baihui',
    category: 'acupoint',
    title: L('百会（DU20）', 'Baihui DU-20', '百会（DU20）', '백회（DU20）', 'Baihui DU-20', 'Baihui DU-20'),
    summary: L(
      '督脉与诸阳经交会穴，头顶正中。升阳举陷、醒脑开窍。气虚下陷之脱肛、阴挺、头晕可用艾灸。',
      'Crown point where all yang channels meet. Raises yang, lifts prolapse, awakens the brain.',
      '督脈と諸陽経の交会穴。昇陽挙陷・醒脳開竅。',
      '독맥과 제양경 교회혈.',
      'Eleva el yang y despierta el cerebro.',
      'Élève le yang et éveille le cerveau.',
    ),
    tags: ['升阳', '醒脑', '督脉'],
  },

  // ===== 养生食疗 =====
  {
    id: 'd_yimi',
    category: 'diet',
    title: L('薏米红豆粥', 'Coix-Red Bean Congee', '薏米小豆粥', '율무팥죽', 'Gachas de Coix y Frijol Rojo', 'Bouillie de coix et haricot rouge'),
    summary: L(
      '健脾祛湿经典食疗。薏米30g、红豆30g浸泡2小时后同煮至烂。适合痰湿、湿热体质：身体困重、舌苔厚腻者。',
      'Classic dampness-draining congee. Suitable for phlegm-damp constitution with heavy body and thick tongue coating.',
      '健脾祛湿の古典食療。痰湿・湿熱体質向け。',
      '건비거습 고전 식료.',
      'Congee clásico para drenar humedad.',
      'Bouillie classique pour drainer l\u2019humidité.',
    ),
    tags: ['祛湿', '粥品', '痰湿质'],
  },
  {
    id: 'd_yinzao',
    category: 'diet',
    title: L('桂圆红枣茶', 'Longan-Jujube Tea', '桂円紅棗茶', '용안대추차', 'Té de Longan y Jujuba', 'Thé longan-jujube'),
    summary: L(
      '养血安神茶饮。桂圆肉10g、红枣5枚掰开沸水焖泡。适合血虚：面色萎黄、心悸失眠。湿热痰湿者少饮。',
      'Blood-nourishing calming tea for pale complexion and insomnia. Avoid if damp-heat.',
      '養血安神の茶飲。血虚向け。',
      '양혈안신 차음.',
      'Té que nutre la sangre y calma.',
      'Thé qui nourrit le sang et apaise.',
    ),
    tags: ['养血', '安神', '茶饮'],
  },
  {
    id: 'd_qingre',
    category: 'diet',
    title: L('绿豆百合汤', 'Mung Bean-Lily Soup', '緑豆百合湯', '녹두백합탕', 'Sopa de Mungo y Lirio', 'Soupe de soja vert et lys'),
    summary: L(
      '清热解毒、宁心除烦。绿豆50g、干百合15g煮至豆开花，可加少量冰糖。夏季暑热心烦者尤宜，脾胃虚寒少食。',
      'Clears summer-heat and calms irritability. Best in hot weather; caution for cold-deficient spleen-stomach.',
      '清熱解毒・寧心除煩。夏季に最適。',
      '청열해독·영심제번.',
      'Depura el calor de verano.',
      'Purge la chaleur estivale.',
    ),
    tags: ['清热', '解暑', '夏令'],
  },
  {
    id: 'd_shanyao',
    category: 'diet',
    title: L('山药小米粥', 'Yam-Millet Congee', '山芋小米粥', '산약좁쌀죽', 'Congee de Ñame y Mijo', 'Bouillie d\u2019igname et millet'),
    summary: L(
      '健脾养胃第一粥。铁棍山药100g去皮切块，与小米50g同煮。适合气虚、脾胃虚弱：食少便溏、病后调养。',
      'The top spleen-strengthening congee. Ideal for weak digestion and post-illness recovery.',
      '健脾養胃の第一粥。気虚・虚弱体質向け。',
      '건비양위 제일죽.',
      'El mejor congee para fortalecer el bazo.',
      'La meilleure bouillie pour tonifier la rate.',
    ),
    tags: ['健脾', '养胃', '气虚质'],
  },
  {
    id: 'd_chuanbei',
    category: 'diet',
    title: L('川贝炖雪梨', 'Chuanbei Steamed Pear', '川貝炖雪梨', '천패동설리', 'Pera al Vapor con Chuanbei', 'Poire vapeur au Chuanbei'),
    summary: L(
      '润肺止咳、化痰生津。雪梨1个去核，纳入川贝粉3g与冰糖，隔水炖30分钟。适合燥咳、干咳少痰。风寒咳嗽不宜。',
      'Moistens lung and stops dry cough. Not for wind-cold cough.',
      '潤肺止咳・化痰生津。燥咳に適する。',
      '윤폐지기·화담생진.',
      'Humedece el pulmón y calma la tos seca.',
      'Humidifie le poumon, calme la toux sèche.',
    ),
    tags: ['润肺', '止咳', '秋燥'],
  },

  // ===== 名医典籍 =====
  {
    id: 'c_huangdi',
    category: 'classic',
    title: L('《黄帝内经》', 'Huangdi Neijing', '黄帝内経', '황제내경', 'Huangdi Neijing', 'Huangdi Neijing'),
    summary: L(
      '中医理论奠基之作，成书于战国至西汉。分《素问》《灵枢》各81篇，确立阴阳五行、藏象经络、治未病等核心理论。',
      'The theoretical foundation of TCM: yin-yang, five phases, zang-fu, meridians and preventive medicine.',
      '中医理論の基石。陰陽五行・蔵象経絡・治未病を確立。',
      '한의 이론의 기초.',
      'Fundamento teórico de la MTC.',
      'Fondement théorique de la MTC.',
    ),
    tags: ['理论奠基', '素问', '灵枢'],
  },
  {
    id: 'c_shanghan',
    category: 'classic',
    title: L('《伤寒杂病论》', 'Shanghan Zabing Lun', '傷寒雑病論', '상한잡병론', 'Shanghan Zabing Lun', 'Shanghan Zabing Lun'),
    summary: L(
      '张仲景著（东汉），确立六经辨证与方证体系，载方314首，“方书之祖”。后世尊张仲景为“医圣”。',
      'By Zhang Zhongjing (Eastern Han): established the six-channel differentiation and 314 formulas. He is revered as the "Sage of Medicine".',
      '張仲景の著作。六経弁証と方証体系を確立。',
      '장중경 저작. 육경변증 확립.',
      'De Zhang Zhongjing: base de la diferenciación por seis canales.',
      'De Zhang Zhongjing : différenciation par six canaux.',
    ),
    tags: ['方书之祖', '六经辨证', '医圣'],
  },
  {
    id: 'c_bencao',
    category: 'classic',
    title: L('《本草纲目》', 'Compendium of Materia Medica', '本草綱目', '본초강목', 'Compendio de Materia Médica', 'Compendium de Materia Medica'),
    summary: L(
      '李时珍著（明1578年），52卷、1892种药、11096首方。集本草学之大成，被誉为“东方药物巨典”。',
      'By Li Shizhen (Ming, 1578): 52 volumes, 1,892 substances, 11,096 formulas — the monumental materia medica.',
      '李時珍の著作。本草学の集大成。',
      '이시진 저작. 본초학의 집대성.',
      'De Li Shizhen: obra monumental de materia médica.',
      'De Li Shizhen : œuvre monumentale de matière médicale.',
    ),
    tags: ['本草', '李时珍', '东方药典'],
  },
  {
    id: 'c_wenbing',
    category: 'classic',
    title: L('《温病条辨》', 'Wenbing Tiaobian', '温病条弁', '온병조변', 'Wenbing Tiaobian', 'Wenbing Tiaobian'),
    summary: L(
      '吴鞠通著（清1798年），创立三焦辨证，完善温热病诊治体系。银翘散、桑菊饮等名方出于此书。',
      'By Wu Jutong (Qing, 1798): established sanjiao differentiation for warm-febrile diseases. Source of Yinqiao San.',
      '呉鞠通の著作。三焦弁証を創立。',
      '오국통 저작. 삼초변증 창시.',
      'De Wu Jutong: diferenciación por sanjiao.',
      'De Wu Jutong : différenciation par sanjiao.',
    ),
    tags: ['温病', '三焦辨证', '清热'],
  },
]

export const KNOWLEDGE_CATEGORY_DEFS: Array<{ key: KnowledgeCategory | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'chat.kbCat_all' },
  { key: 'formula', labelKey: 'chat.kbCat_formula' },
  { key: 'herb', labelKey: 'chat.kbCat_herb' },
  { key: 'acupoint', labelKey: 'chat.kbCat_acupoint' },
  { key: 'diet', labelKey: 'chat.kbCat_diet' },
  { key: 'classic', labelKey: 'chat.kbCat_classic' },
]
