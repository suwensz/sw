import type { Conversation, ChatMessage } from '@/types'

export const mockConversations: Conversation[] = [
  {
    id: 'c001',
    title: '失眠调理咨询',
    lastMessage: '建议您晚上11点前入睡，可以按摩神门穴...',
    updatedAt: '2024-01-15T10:30:00Z',
    unread: 0,
  },
  {
    id: 'c002',
    title: '湿气重的表现',
    lastMessage: '湿气重常见身体沉重、大便黏滞等表现...',
    updatedAt: '2024-01-14T15:20:00Z',
    unread: 2,
  },
  {
    id: 'c003',
    title: '养生茶饮推荐',
    lastMessage: '根据您的体质，推荐红枣桂圆枸杞茶...',
    updatedAt: '2024-01-13T09:00:00Z',
    unread: 0,
  },
]

export const mockMessages: Record<string, ChatMessage[]> = {
  c001: [
    {
      id: 'm1',
      role: 'user',
      content: '我最近总是失眠，晚上很难入睡，白天又很疲惫，中医怎么调理？',
      timestamp: '2024-01-15T10:25:00Z',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: '失眠在中医看来多与心脾两虚、阴虚火旺或肝郁化火有关。请问您除了入睡困难，是否还有以下情况：\n1. 多梦易醒？\n2. 心烦心悸？\n3. 口干舌燥？\n4. 情绪低落或烦躁？\n\n这些信息有助于我更准确地判断您的证型。',
      timestamp: '2024-01-15T10:26:00Z',
    },
    {
      id: 'm3',
      role: 'user',
      content: '多梦易醒，白天心悸，有时候还心烦',
      timestamp: '2024-01-15T10:28:00Z',
    },
    {
      id: 'm4',
      role: 'assistant',
      content: '根据您的描述，您的情况偏向于心脾两虚型失眠。以下是一些调理建议：\n\n【起居调摄】\n• 晚上11点前入睡，睡前1小时远离电子屏幕\n• 睡前可用40°C温水泡脚15分钟\n\n【穴位按摩】\n• 神门穴：手腕横纹小指侧，按揉3分钟\n• 内关穴：腕横纹上2寸，按揉3分钟\n• 涌泉穴：足底前1/3凹陷处，睡前搓热\n\n【饮食调养】\n• 推荐：百合莲子粥、酸枣仁茶、桂圆红枣茶\n• 少食：辛辣刺激、咖啡、浓茶\n\n【运动保健】\n• 白天适度运动，如八段锦、太极拳\n• 睡前做轻柔的腹式呼吸\n\n坚持调理2-4周会有明显改善。如症状持续加重，建议就医。',
      timestamp: '2024-01-15T10:30:00Z',
      products: [],
    },
  ],
}

export interface AiReply {
  content: string
  products?: string[]
}

export function getAiReply(userMessage: string): AiReply {
  const msg = userMessage.toLowerCase()
  if (msg.includes('失眠') || msg.includes('sleep') || msg.includes('insomnia') || msg.includes('眠れない')) {
    return {
      content: '失眠在中医中多与心神失养、阴阳失调有关。根据您的情况，建议：\n\n1. **起居调养**：晚上11点前入睡，睡前1小时避免使用电子产品\n2. **饮食建议**：可饮用百合莲子茶、酸枣仁茶，避免咖啡和浓茶\n3. **穴位按摩**：每晚按揉神门穴、内关穴各3分钟\n4. **情志调节**：白天适度运动，睡前做深呼吸放松\n\n以下是为您推荐的安神助眠产品：',
      products: ['p006', 'p008'],
    }
  }
  if (msg.includes('湿气') || msg.includes('damp') || msg.includes('湿気')) {
    return {
      content: '湿气重的常见表现：\n• 身体沉重、四肢乏力\n• 大便黏滞不爽\n• 舌苔厚腻、舌边有齿痕\n• 面部油腻、易长痘\n• 食欲不振、腹胀\n\n调理建议：\n1. 饮食清淡，少食生冷油腻\n2. 适量运动，微微出汗\n3. 可食用薏米、红豆、茯苓等健脾利湿食材\n4. 避免居住潮湿环境\n\n为您推荐以下健脾祛湿产品：',
      products: ['p007'],
    }
  }
  if (msg.includes('气虚') || msg.includes('qi defic') || msg.includes('気虚')) {
    return {
      content: '气虚体质的调理以补气健脾为主：\n\n1. **饮食调养**：多食山药、红枣、鸡肉、人参、黄芪等\n2. **起居调摄**：避免过度劳累，保证充足睡眠\n3. **运动保健**：适合柔和的运动如八段锦、太极拳，避免剧烈运动\n4. **情志调摄**：保持心情舒畅，避免过度思虑\n\n为您推荐以下补气产品：',
      products: ['p001', 'p006'],
    }
  }
  if (msg.includes('茶') || msg.includes('tea') || msg.includes('お茶')) {
    return {
      content: '养生茶需根据体质选择：\n\n• **气虚体质**：红枣桂圆枸杞茶、人参茶\n• **阳虚体质**：生姜红枣茶、肉桂红茶\n• **阴虚体质**：菊花茶、麦冬茶\n• **痰湿体质**：陈皮普洱茶、茯苓茶\n• **湿热体质**：菊花决明子茶、薏米茶\n• **气郁体质**：玫瑰花茶、茉莉花茶\n• **血瘀体质**：山楂红茶、桃花茶\n\n请问您是什么体质？我可以为您精准推荐。以下是几款热门养生茶：',
      products: ['p003', 'p006', 'p008'],
    }
  }
  return {
    content: '感谢您的提问。作为中医智能体，我可以为您提供：\n\n1. **健康咨询**：根据中医理论解答健康问题\n2. **体质辨识**：帮您了解自己的体质类型\n3. **调理建议**：提供饮食、起居、运动等个性化方案\n4. **产品推荐**：根据您的体质和健康需求推荐适合的中医药产品\n\n您可以更详细地描述您的症状或健康需求，我会尽力为您解答。',
  }
}

export const suggestedQuestions = {
  zh: [
    '我最近总是失眠，中医怎么调理？',
    '湿气重有什么表现？',
    '气虚体质适合吃什么？',
    '推荐一些养生茶饮',
  ],
  en: [
    'I have trouble sleeping, how can TCM help?',
    'What are the signs of excess dampness?',
    'What should qi-deficiency constitution eat?',
    'Recommend some wellness teas',
  ],
  ja: [
    '最近よく眠れません。漢方ではどう調整しますか？',
    '湿気が多い体質の症状は？',
    '気虚体質におすすめの食べ物は？',
    'おすすめの養生茶を教えて',
  ],
  ko: [
    '요즘 잠을 잘 못 자요. 한의학에서는 어떻게 조절하나요?',
    '습기가 많은 체질의 증상은?',
    '기허 체질에 좋은 음식은?',
    '양생 차 추천해 주세요',
  ],
  es: [
    'No duermo bien, ¿cómo puede ayudar la MTC?',
    '¿Cuáles son los signos del exceso de humedad?',
    '¿Qué debe comer la constitución de deficiencia de qi?',
    'Recomienda algunos tés de bienestar',
  ],
  fr: [
    'Je dors mal, comment la MTC peut-elle aider ?',
    'Quels sont les signes d\'un excès d\'humidité ?',
    'Que doit manger une constitution en déficit de qi ?',
    'Recommandez des thés bien-être',
  ],
}
