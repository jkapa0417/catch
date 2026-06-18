import type { Lang, Mode } from '@shared/types'

type ModeMap = Record<Mode, string>

export interface Dict {
  brand: string
  titlebar: string
  subtitle: string
  settings: string
  newNote: string
  newProject: string
  muscle: string
  wheels: string
  reliance: string
  week: string
  weekDesc: string
  titlePh: string
  coach: string
  composerPh: string
  stagedAsk: string
  stagedOr: string
  edit: string
  hintArmed: string
  hintDefault: string
  ownerHint: string
  emptyCapture: string
  aiBackup: string
  aiPh: string
  aiOrganize: string
  rightHeader: string
  shareHint: string
  aiEval: string
  evalGood: string
  evalImprove: string
  evalRewrite: string
  before: string
  after: string
  trend: string
  summaryTitle: string
  emptySummary: string
  expNotion: string
  expMd: string
  expCopy: string
  expObsidian: string
  delNote: string
  tierStrong: string
  tierGood: string
  tierOk: string
  tierWeak: string
  tierNone: string
  crit: { brevity: string; action: string; oneidea: string; complete: string; clarity: string }
  setTitle: string
  setAi: string
  setAiDesc: string
  setProvider: string
  setKey: string
  setKeyPh: string
  setBaseUrl: string
  setBaseUrlPh: string
  setModel: string
  setModelHint: string
  getKey: string
  setConnect: string
  setLang: string
  done: string
  setIntegrations: string
  setIntegrationsDesc: string
  notionLabel: string
  notionTokenLabel: string
  notionTokenPh: string
  notionParentLabel: string
  notionParentPh: string
  obsidianLabel: string
  obsidianVaultLabel: string
  obsidianVaultPh: string
  saveLabel: string
  notionSavedText: string
  modeLabel: ModeMap
  coachText: ModeMap
  evalResultGood: string
  evalResultImprove: string
  evalBefore: string
  evalAfter: string
  streak: (n: number) => string
  toNext: (n: number) => string
  captured: (n: number) => string
  count: (n: number) => string
  scoreSub: (p: number, c: number) => string
  trendStat: (n: number, b: number) => string
  trendUp: (d: number) => string
  trendDown: string
  trendFlat: string
  trendOne: string
  connected: (p: string) => string
  tNotion: string
  tMd: string
  tCopy: string
  tObsidian: string
  tDel: string
  tLastNote: string
  tConn: (p: string) => string
  tNeedKey: string
  tNeedBaseUrl: string
  tNeedModel: string
  aiNeed: string
  aiOrganizing: string
  aiAdded: (n: number) => string
  evalNeed: string
  evaluating: string
  newProjectName: string
  ctx: {
    rename: string
    del: string
    duplicate: string
    moveUp: string
    moveDown: string
    moveTo: string
    newNote: string
    deleteProject: string
    chooseType: string
  }
  tProjDel: string
  tNoteDup: string
  tNoteMoved: string
}

export const L: Record<Lang, Dict> = {
  ko: {
    brand: '캐치',
    titlebar: '캐치 — 노트 근육 트레이너',
    subtitle: '그냥 적으면, 정리는 익숙해질 때까지',
    settings: '설정',
    newNote: '새 노트',
    newProject: '프로젝트 추가',
    muscle: '노트 근육',
    wheels: '보조바퀴',
    reliance: 'AI 의존도',
    week: '이번 주',
    weekDesc: '평균 점수 변화',
    titlePh: '무엇에 대한 노트야?',
    coach: '코치',
    composerPh: '떠오르는 대로 한 줄씩 적고 → Enter 로 분류 단계로',
    stagedAsk: '어디에 넣을까?',
    stagedOr: '또는 아래 버튼',
    edit: '수정',
    hintArmed: '이제 1·2·3·4 또는 버튼을 누르면 분류돼',
    hintDefault: '숫자가 들어간 내용도 안전해 — 다 적고 Enter 누른 뒤 분류해',
    ownerHint: '담당자는 @이름 으로 적으면 자동 인식',
    emptyCapture: '아직 비어있어. 한 줄 적고 Enter → 숫자키로 분류해봐.',
    aiBackup: '못 따라갔을 때 → AI가 정리 (백업)',
    aiPh: '휘갈긴 메모를 통째로 붙여넣으면 이 모드 기준으로 분류해줄게.',
    aiOrganize: 'AI로 정리하기',
    rightHeader: '정리 & 성장',
    shareHint: '복사해서 바로 공유',
    aiEval: 'AI 상세 평가',
    evalGood: '잘한 점',
    evalImprove: '이렇게 하면 더 좋아져요',
    evalRewrite: '예시로 한 줄 고쳐봤어요',
    before: '전:',
    after: '후:',
    trend: '점수 추이',
    summaryTitle: '정리된 요약',
    emptySummary: '분류한 내용이 여기에 자동으로 정리돼.',
    expNotion: 'Notion에 보내기',
    expMd: '.md 내보내기',
    expCopy: '복사',
    expObsidian: 'Obsidian 열기',
    delNote: '이 노트 삭제',
    tierStrong: '탄탄한 노트예요',
    tierGood: '좋아요 — 한 가지만 더 다듬어볼까요',
    tierOk: '다듬을 부분이 보여요',
    tierWeak: '같이 정리 연습해봐요',
    tierNone: '노트를 적으면 점수가 매겨져',
    crit: { brevity: '간결성', action: '실행 가능성', oneidea: '한 가지씩', complete: '빠짐없이', clarity: '명료성' },
    setTitle: '설정',
    setAi: 'AI Provider 연결',
    setAiDesc: 'AI 정리·평가에 사용할 제공자를 연결하세요.',
    setProvider: '제공자',
    setKey: 'API 키',
    setKeyPh: 'sk-...',
    setBaseUrl: 'Base URL',
    setBaseUrlPh: 'https://...',
    setModel: '모델',
    setModelHint: '비워두면 기본 모델 사용',
    getKey: 'API 키 발급',
    setConnect: '연결',
    setLang: '언어',
    done: '완료',
    setIntegrations: '내보내기 연동',
    setIntegrationsDesc: 'Notion·Obsidian 내보내기를 설정하세요.',
    notionLabel: 'Notion',
    notionTokenLabel: '통합 토큰',
    notionTokenPh: 'secret_... 또는 ntn_...',
    notionParentLabel: '상위 페이지 ID',
    notionParentPh: '32자리 페이지 ID',
    obsidianLabel: 'Obsidian',
    obsidianVaultLabel: '볼트 이름',
    obsidianVaultPh: '내 볼트 (선택)',
    saveLabel: '저장',
    notionSavedText: 'Notion 토큰 저장됨',
    modeLabel: { meeting: '회의', brainstorm: '브레인스토밍', switch: '작업 전환', daily: '하루 정리' },
    coachText: {
      meeting:
        '결정=뭘 하기로 했나, 할 일=누가 언제까지, 질문=아직 안 정해진 것. 이 구분만 익히면 회의록이 쉬워져.',
      brainstorm: '일단 다 쏟아내고(아이디어), 살릴 건 발전으로. 평가·정리는 나중에 — 지금은 양이 먼저야.',
      switch: '자리 뜨기 전에 하던 일과 다음 할 일만 남겨도 복귀가 빨라져. 막힌 건 막힌 것에 던져둬.',
      daily: '한 일을 적는 게 핵심. 작아 보여도 다 적어두면 네가 한 일이 눈에 보여 — 회고도 보고도 쉬워져.'
    },
    evalResultGood: '결정과 할 일이 또렷하게 분리돼 있어요. 담당자 표기도 잘 챙겼어요.',
    evalResultImprove: '‘논의’ 항목은 한 줄에 결론까지 같이 적으면 나중에 찾기 쉬워요.',
    evalBefore: '리텐션이 2주차에 급락하는 원인 분석 필요',
    evalAfter: '[논의] 2주차 리텐션 급락 → @수아 원인 분석 (수요일까지)',
    streak: (n) => `${n}일 연속`,
    toNext: (n) => `다음 레벨까지 ${n}개`,
    captured: (n) => `${n}개 캐치`,
    count: (n) => `${n}개`,
    scoreSub: (p, c) => `직접 분류 ${p}% · 기준 ${c}개로 평가`,
    trendStat: (n, b) => `${n}개 기록 · 최고 ${b}점`,
    trendUp: (d) => `처음보다 ${d}점 올랐어요 — 노트 근육이 붙고 있어요`,
    trendDown: '요즘 점수가 좀 내려갔어요. 약한 기준 하나를 골라볼까요?',
    trendFlat: '꾸준히 유지 중이에요. 약한 기준 하나에 집중해봐도 좋아요.',
    trendOne: '내일 또 적으면 변화가 선으로 그려져요.',
    connected: (p) => `${p} 연결됨`,
    tNotion: 'Notion 페이지를 만들었어',
    tMd: '.md 내보내기 완료 — 볼트 폴더에 넣으면 끝',
    tCopy: '복사 완료 — 어디든 붙여넣기',
    tObsidian: 'Obsidian으로 보냈어',
    tDel: '노트를 삭제했어',
    tLastNote: '마지막 노트는 지울 수 없어',
    tConn: (p) => `${p} 연결됨`,
    tNeedKey: 'API 키를 입력해줘.',
    tNeedBaseUrl: 'Base URL을 입력해줘.',
    tNeedModel: '모델 이름을 입력해줘.',
    aiNeed: '정리할 메모를 먼저 붙여넣어줘.',
    aiOrganizing: '정리하는 중…',
    aiAdded: (n) => `${n}개 정리해서 추가했어 (직접 분류도 한 번씩 해보면 더 빨리 익어)`,
    evalNeed: '평가할 노트를 먼저 적어줘.',
    evaluating: '평가 중…',
    newProjectName: '새 프로젝트',
    ctx: {
      rename: '이름 변경',
      del: '삭제',
      duplicate: '복제',
      moveUp: '위로 이동',
      moveDown: '아래로 이동',
      moveTo: '다른 프로젝트로 이동',
      newNote: '새 노트',
      deleteProject: '프로젝트 삭제',
      chooseType: '노트 유형 선택'
    },
    tProjDel: '프로젝트를 삭제했어',
    tNoteDup: '노트를 복제했어',
    tNoteMoved: '노트를 옮겼어'
  },
  en: {
    brand: 'Catch',
    titlebar: 'Catch — Note Muscle Trainer',
    subtitle: "Just jot it down — we organize till it's habit",
    settings: 'Settings',
    newNote: 'New note',
    newProject: 'Add project',
    muscle: 'Note Muscle',
    wheels: 'Training wheels',
    reliance: 'AI reliance',
    week: 'This week',
    weekDesc: 'avg score change',
    titlePh: "What's this note about?",
    coach: 'Coach',
    composerPh: 'Jot one line at a time → press Enter to classify',
    stagedAsk: 'Where does it go?',
    stagedOr: 'or a button below',
    edit: 'Edit',
    hintArmed: 'Now press 1·2·3·4 or a button to file it',
    hintDefault: 'Numbers are safe too — write it all, press Enter, then classify',
    ownerHint: 'Assign owners by typing @name',
    emptyCapture: 'Empty for now. Write a line, press Enter, then a number key.',
    aiBackup: 'Fell behind? Let AI organize it (backup)',
    aiPh: 'Paste your raw scribbles and AI will sort them by this mode.',
    aiOrganize: 'Organize with AI',
    rightHeader: 'Organize & Growth',
    shareHint: 'Copy to share instantly',
    aiEval: 'Detailed AI review',
    evalGood: 'What worked',
    evalImprove: 'Try this to improve',
    evalRewrite: 'Rewrote one line as an example',
    before: 'Before:',
    after: 'After:',
    trend: 'Score trend',
    summaryTitle: 'Organized summary',
    emptySummary: 'Classified items get organized here automatically.',
    expNotion: 'Send to Notion',
    expMd: 'Export .md',
    expCopy: 'Copy',
    expObsidian: 'Open in Obsidian',
    delNote: 'Delete this note',
    tierStrong: 'Solid note',
    tierGood: 'Nice — just polish one thing',
    tierOk: 'Room to tighten up',
    tierWeak: "Let's practice together",
    tierNone: 'Write notes to get a score',
    crit: { brevity: 'Brevity', action: 'Actionable', oneidea: 'One idea', complete: 'Complete', clarity: 'Clarity' },
    setTitle: 'Settings',
    setAi: 'Connect AI Provider',
    setAiDesc: 'Connect a provider for AI organize & review.',
    setProvider: 'Provider',
    setKey: 'API key',
    setKeyPh: 'sk-...',
    setBaseUrl: 'Base URL',
    setBaseUrlPh: 'https://...',
    setModel: 'Model',
    setModelHint: 'Leave blank to use the default model',
    getKey: 'Get API key',
    setConnect: 'Connect',
    setLang: 'Language',
    done: 'Done',
    setIntegrations: 'Export integrations',
    setIntegrationsDesc: 'Configure Notion and Obsidian export.',
    notionLabel: 'Notion',
    notionTokenLabel: 'Integration token',
    notionTokenPh: 'secret_... or ntn_...',
    notionParentLabel: 'Parent page ID',
    notionParentPh: '32-character page ID',
    obsidianLabel: 'Obsidian',
    obsidianVaultLabel: 'Vault name',
    obsidianVaultPh: 'My Vault (optional)',
    saveLabel: 'Save',
    notionSavedText: 'Notion token saved',
    modeLabel: { meeting: 'Meeting', brainstorm: 'Brainstorm', switch: 'Task switch', daily: 'Daily wrap-up' },
    coachText: {
      meeting:
        'Decision = what you’ll do, Action = who by when, Question = still open. Master this split and minutes get easy.',
      brainstorm: 'Dump everything first (ideas), promote keepers to Develop. Judge later — quantity first.',
      switch:
        'Before you step away, leaving just Doing and Next speeds your return. Toss blockers into Blocked.',
      daily: 'Logging what you Did is the core. Even small wins — written down, your work becomes visible.'
    },
    evalResultGood: 'Decisions and actions are clearly separated. Owners are well marked too.',
    evalResultImprove:
      "For 'Discussion' items, write the conclusion on the same line so they're easy to find later.",
    evalBefore: 'Need to analyze why retention drops in week 2',
    evalAfter: '[Discussion] Week-2 retention drop → @Sua root-cause analysis (by Wed)',
    streak: (n) => `${n} day streak`,
    toNext: (n) => `${n} to next level`,
    captured: (n) => `${n} captured`,
    count: (n) => `${n}`,
    scoreSub: (p, c) => `Self-classified ${p}% · scored on ${c} criteria`,
    trendStat: (n, b) => `${n} records · best ${b}`,
    trendUp: (d) => `Up ${d} pts from the start — your note muscle is growing`,
    trendDown: 'Scores dipped lately. Pick one weak criterion to focus on?',
    trendFlat: 'Holding steady. Try focusing on one weak criterion.',
    trendOne: 'Write again tomorrow and the trend will draw a line.',
    connected: (p) => `${p} connected`,
    tNotion: 'Created a Notion page',
    tMd: '.md exported — drop it in your vault',
    tCopy: 'Copied — paste anywhere',
    tObsidian: 'Sent to Obsidian',
    tDel: 'Note deleted',
    tLastNote: "Can't delete the last note",
    tConn: (p) => `${p} connected`,
    tNeedKey: 'Enter an API key.',
    tNeedBaseUrl: 'Enter a base URL.',
    tNeedModel: 'Enter a model name.',
    aiNeed: 'Paste the notes to organize first.',
    aiOrganizing: 'Organizing…',
    aiAdded: (n) => `Added ${n} organized items (try classifying yourself too — you'll learn faster)`,
    evalNeed: 'Write some notes to review first.',
    evaluating: 'Reviewing…',
    newProjectName: 'New project',
    ctx: {
      rename: 'Rename',
      del: 'Delete',
      duplicate: 'Duplicate',
      moveUp: 'Move up',
      moveDown: 'Move down',
      moveTo: 'Move to project',
      newNote: 'New note',
      deleteProject: 'Delete project',
      chooseType: 'Choose a note type'
    },
    tProjDel: 'Project deleted',
    tNoteDup: 'Note duplicated',
    tNoteMoved: 'Note moved'
  }
}
