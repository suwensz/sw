import type { ConstitutionType, ConstitutionQuestion } from '@/types'

export const constitutionTypes: ConstitutionType[] = [
  {
    id: 'balanced',
    name: { zh: '平和质', en: 'Balanced', ja: '平和質', ko: '평화질', es: 'Equilibrado', fr: 'Équilibré' },
    description: {
      zh: '阴阳气血调和，体态适中，面色红润，精力充沛',
      en: 'Harmonized yin-yang and qi-blood, moderate build, ruddy complexion, energetic',
      ja: '陰陽・気血が調和し、適度な体格、血色が良く活気に満ちる',
      ko: '음양 기혈이 조화되고 적당한 체격, 혈색이 좋고 활기참',
      es: 'Yin-yang y qi-sangre armonizados, complexión rubicunda, enérgico',
      fr: 'Yin-yang et qi-sang harmonisés, teint vermeil, énergique',
    },
    characteristics: {
      zh: '体形匀称，面色润泽，头发稠密有光泽，目光有神，鼻色明润，嗅觉通利，味觉正常，精力充沛，耐受寒热，睡眠良好，胃口佳',
      en: 'Proportionate build, moist complexion, thick lustrous hair, bright eyes, good appetite and sleep, tolerates both cold and heat',
      ja: '均整の取れた体格、潤いのある肌、つややかな髪、輝く目、良好な食欲と睡眠、寒暑に強い',
      ko: '균형 잡힌 체격, 윤기 있는 피부, 윤기 나는 머리카락, 맑은 눈, 좋은 식욕과 수면, 한서에 강함',
      es: 'Complexión proporcionada, piel hidratada, cabello brillante, ojos vivaces, buen apetito y sueño, tolera frío y calor',
      fr: 'Complexion proportionnée, peau hydratée, cheveux brillants, yeux vifs, bon appétit et sommeil, tolère froid et chaleur',
    },
    suggestions: {
      zh: '保持规律作息，适度运动，饮食均衡，注意四时养生',
      en: 'Maintain regular routine, moderate exercise, balanced diet, follow seasonal wellness',
      ja: '規則正しい生活、適度な運動、バランスの良い食事、四季に応じた養生',
      ko: '규칙적인 생활, 적당한 운동, 균형 잡힌 식사, 사계절 양생',
      es: 'Mantener rutina regular, ejercicio moderado, dieta equilibrada, bienestar estacional',
      fr: 'Maintenir une routine régulière, exercice modéré, alimentation équilibrée, bien-être saisonnier',
    },
    dietTips: {
      zh: '不偏食，五谷杂粮、蔬菜水果、肉蛋奶合理搭配',
      en: 'Eat a balanced mix of grains, vegetables, fruits, meat, eggs, and dairy',
      ja: '偏食せず、雑穀、野菜、果物、肉、卵、乳製品をバランスよく',
      ko: '편식하지 않고 잡곡, 채소, 과일, 고기, 달걀, 유제품 균형 있게',
      es: 'Dieta equilibrada de granos, verduras, frutas, carne, huevos y lácteos',
      fr: 'Alimentation équilibrée en céréales, légumes, fruits, viande, œufs et produits laitiers',
    },
    color: '#52a67a',
  },
  {
    id: 'qiDeficiency',
    name: { zh: '气虚质', en: 'Qi-Deficiency', ja: '気虚質', ko: '기허질', es: 'Deficiencia de Qi', fr: 'Déficit en Qi' },
    description: {
      zh: '元气不足，以疲乏、气短、自汗等气虚表现为主要特征',
      en: 'Insufficient original qi, characterized by fatigue, shortness of breath, spontaneous sweating',
      ja: '元気不足、疲労、息切れ、自汗が主な特徴',
      ko: '원기 부족, 피로, 숨가쁨, 자한이 주요 특징',
      es: 'Qi original insuficiente, fatiga, dificultad respiratoria, sudoración espontánea',
      fr: 'Qi originel insuffisant, fatigue, essoufflement, transpiration spontanée',
    },
    characteristics: {
      zh: '肌肉松软，声音低弱，易出汗，易疲劳，易感冒，舌淡红，舌边有齿痕',
      en: 'Soft muscles, weak voice, easy sweating, fatigue, prone to colds, pale tongue with teeth marks',
      ja: '筋肉が柔らかい、声が弱い、汗をかきやすい、疲れやすい、風邪をひきやすい',
      ko: '근육이 무름, 약한 목소리, 땀을 잘 흘림, 피로하기 쉬움, 감기에 잘 걸림',
      es: 'Músculos blandos, voz débil, sudoración fácil, fatiga, propenso a resfriados',
      fr: 'Muscles mous, voix faible, transpiration facile, fatigue, enclin aux rhumes',
    },
    suggestions: {
      zh: '宜补气健脾，避免过度劳累，可练八段锦、太极拳',
      en: 'Tonify qi and strengthen spleen, avoid overexertion, practice Baduanjin or Tai Chi',
      ja: '気を補い脾を強める、過労を避け、八段錦や太極拳を',
      ko: '기를 보하고 비장을 강화, 과로 피하고 팔단금이나 태극권을',
      es: 'Tonificar qi y fortalecer bazo, evitar sobreesfuerzo, practicar Baduanjin o Tai Chi',
      fr: 'Tonifier le qi et renforcer la rate, éviter le surmenage, pratiquer Baduanjin ou Tai Chi',
    },
    dietTips: {
      zh: '宜食黄豆、山药、香菇、大枣、鸡肉、人参、黄芪等',
      en: 'Soybeans, yam, shiitake, jujube, chicken, ginseng, astragalus',
      ja: '大豆、山芋、シイタケ、なつめ、鶏肉、人参、黄耆など',
      ko: '대두, 마, 표고버섯, 대추, 닭고기, 인삼, 황기 등',
      es: 'Soja, ñame, shiitake, jujube, pollo, ginseng, astrágalo',
      fr: 'Soja, igname, shiitaké, jujube, poulet, ginseng, astragale',
    },
    color: '#e6a23c',
  },
  {
    id: 'yangDeficiency',
    name: { zh: '阳虚质', en: 'Yang-Deficiency', ja: '陽虚質', ko: '양허질', es: 'Deficiencia de Yang', fr: 'Déficit en Yang' },
    description: {
      zh: '阳气不足，以畏寒怕冷、手足不温等虚寒表现为主要特征',
      en: 'Insufficient yang, characterized by aversion to cold, cold hands and feet',
      ja: '陽気不足、寒がり、手足の冷えが主な特徴',
      ko: '양기 부족, 추위를 타고 손발이 차가움이 주요 특징',
      es: 'Yang insuficiente, aversión al frío, manos y pies fríos',
      fr: 'Yang insuffisant, aversion au froid, mains et pieds froids',
    },
    characteristics: {
      zh: '肌肉松软，畏寒怕冷，手足不温，喜热饮食，精神不振，舌淡胖嫩',
      en: 'Soft muscles, aversion to cold, cold limbs, prefers hot food, low spirit, pale swollen tongue',
      ja: '筋肉が柔らかい、寒がり、手足が冷たい、温かい食べ物を好む、元気がない',
      ko: '근육이 무름, 추위를 탐, 손발이 참, 따뜻한 음식 선호, 기운이 없음',
      es: 'Músculos blandos, aversión al frío, extremidades frías, prefiere comida caliente, bajo ánimo',
      fr: 'Muscles mous, aversion au froid, extrémités froides, préfère la nourriture chaude, abattement',
    },
    suggestions: {
      zh: '宜温阳驱寒，注意保暖，适当户外运动，多晒太阳',
      en: 'Warm yang and dispel cold, keep warm, exercise outdoors, get sunlight',
      ja: '陽を温め冷えを追い出す、保温を心がけ、屋外運動、日光浴を',
      ko: '양을 따뜻하게 하고 냉기를 쫓음, 보온 유의, 야외 운동, 일광욕',
      es: 'Calentar yang y dispersar frío, mantenerse abrigado, ejercicio al aire libre, tomar sol',
      fr: 'Réchauffer le yang et chasser le froid, se tenir chaud, exercice en plein air, soleil',
    },
    dietTips: {
      zh: '宜食羊肉、牛肉、韭菜、生姜、核桃、桂圆等温热食物',
      en: 'Lamb, beef, leek, ginger, walnut, longan and other warming foods',
      ja: '羊肉、牛肉、ニラ、ショウガ、クルミ、竜眼など温熱性の食べ物',
      ko: '양고기, 소고기, 부추, 생강, 호두, 용안 등 따뜻한 음식',
      es: 'Cordero, ternera, puerro, jengibre, nuez, longan y alimentos calientes',
      fr: 'Agneau, bœuf, poireau, gingembre, noix, longane et aliments chauds',
    },
    color: '#d96b5c',
  },
]

export const allConstitutionQuestions: ConstitutionQuestion[] = [
  {
    id: 1,
    dimension: 'qiDeficiency',
    question: {
      zh: '您容易感到疲乏吗？', en: 'Do you easily feel fatigued?', ja: '疲れやすいですか？', ko: '쉽게 피로합니까?', es: '¿Se fatiga fácilmente?', fr: 'Vous fatiguez-vous facilement ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 2,
    dimension: 'qiDeficiency',
    question: {
      zh: '您容易气短（呼吸短促、接不上气）吗？', en: 'Do you easily get short of breath?', ja: '息切れしやすいですか？', ko: '숨이 짧다고 느낍니까?', es: '¿Le falta el aliento con facilidad?', fr: 'Avez-vous facilement le souffle court ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 3,
    dimension: 'yangDeficiency',
    question: {
      zh: '您手脚发凉吗？', en: 'Do your hands and feet feel cold?', ja: '手足が冷えますか？', ko: '손발이 차갑습니까?', es: '¿Tiene las manos y los pies fríos?', fr: 'Avez-vous les mains et les pieds froids ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 4,
    dimension: 'yangDeficiency',
    question: {
      zh: '您胃脘部、背部或腰膝部怕冷吗？', en: 'Do your stomach, back or knees feel cold?', ja: 'お腹、背中、腰や膝が冷えますか？', ko: '배, 등, 허리나 무릎이 춥습니까?', es: '¿Siente frío en el estómago, espalda o rodillas?', fr: 'Votre estomac, dos ou genoux sont-ils froids ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 5,
    dimension: 'yinDeficiency',
    question: {
      zh: '您感到手脚心发热吗？', en: 'Do you feel heat in palms and soles?', ja: '手のひらや足の裏が熱く感じますか？', ko: '손바닥과 발바닥이 뜨겁습니까?', es: '¿Siente calor en palmas y plantas?', fr: 'Sentez-vous de la chaleur dans les paumes et plantes ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 6,
    dimension: 'yinDeficiency',
    question: {
      zh: '您感觉口干咽燥、潮热盗汗吗？', en: 'Do you have dry mouth, hot flashes or night sweats?', ja: '口の渇き、ほてり、寝汗がありますか？', ko: '입 마름, 안면 홍조, 도한이 있습니까?', es: '¿Tiene boca seca, sofocos o sudores nocturnos?', fr: 'Avez-vous bouche sèche, bouffées de chaleur ou sueurs nocturnes ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 7,
    dimension: 'phlegmDampness',
    question: {
      zh: '您感到胸闷或腹部胀满吗？', en: 'Do you feel chest tightness or abdominal bloating?', ja: '胸のつかえや腹部の膨満感がありますか？', ko: '가슴 답답함이나 복부 팽만감이 있습니까?', es: '¿Siente opresión en el pecho o hinchazón abdominal?', fr: 'Ressentez-vous une oppression thoracique ou ballonnements ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 8,
    dimension: 'phlegmDampness',
    question: {
      zh: '您感到身体沉重不轻松或不爽快吗？', en: 'Do you feel heavy or sluggish in your body?', ja: '体が重くだるく感じますか？', ko: '몸이 무겁거나 나른합니까?', es: '¿Se siente pesado o lento?', fr: 'Vous sentez-vous lourd ou lent ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
  {
    id: 9,
    dimension: 'dampHeat',
    question: {
      zh: '您面部或鼻部有油腻感或者油亮发光吗？', en: 'Is your face or nose oily or shiny?', ja: '顔や鼻が脂っぽくテカりますか？', ko: '얼굴이나 코가 기름지거나 번들거립니까?', es: '¿Tiene la cara o nariz grasosa?', fr: 'Votre visage ou nez est-il gras ou brillant ?',
    },
    options: [
      { score: 1, label: { zh: '没有', en: 'Never', ja: 'ない', ko: '없음', es: 'Nunca', fr: 'Jamais' } },
      { score: 2, label: { zh: '很少', en: 'Rarely', ja: 'まれ', ko: '거의 없음', es: 'Rara vez', fr: 'Rarement' } },
      { score: 3, label: { zh: '有时', en: 'Sometimes', ja: '時々', ko: '가끔', es: 'A veces', fr: 'Parfois' } },
      { score: 4, label: { zh: '经常', en: 'Often', ja: 'よく', ko: '자주', es: 'A menudo', fr: 'Souvent' } },
      { score: 5, label: { zh: '总是', en: 'Always', ja: 'いつも', ko: '항상', es: 'Siempre', fr: 'Toujours' } },
    ],
  },
]
