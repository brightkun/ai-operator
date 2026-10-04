import type {
  CalendarDay,
  DriveFile,
  DriveFolder,
  Email,
  Note,
  Suggestion,
} from "@/lib/types";

export const suggestions: Suggestion[] = [
  {
    id: "inbox-summary",
    icon: "inbox",
    title: "Inbox summary",
    description: "Summarize the most important emails in my inbox today",
  },
  {
    id: "todays-schedule",
    icon: "calendar",
    title: "Today's schedule",
    description: "What's on my calendar for today?",
  },
  {
    id: "find-file",
    icon: "folder",
    title: "Find a file",
    description: "Find the latest budget file in my Drive",
  },
  {
    id: "create-note",
    icon: "note",
    title: "Create a note",
    description: "Create a note with today's meeting takeaways",
  },
];

export const emails: Email[] = [
  {
    id: "1",
    sender: "Supabase",
    subject: "Supa Update Sep 2026",
    preview: "Everything that happened in the last month at Supabase",
    read: false,
    starred: false,
  },
  {
    id: "2",
    sender: "Railway",
    subject:
      "One-click Postgres major version upgrades, email forwarding for Railway domains, Claude Max 20x for Conductors",
    preview:
      "It's Friday and you know what that means! Here's a summary of the stuff we shipped this week",
    read: false,
    starred: false,
  },
  {
    id: "3",
    sender: "ClickUp Team",
    subject: "You repeat yourself more than you think",
    preview:
      "Does this sound like you? Some tasks are like reruns that never end. Show me what to automate.",
    read: false,
    starred: false,
  },
  {
    id: "4",
    sender: "Quincy Larson",
    subject: "Learn Python interactively [Free 4-hour course for beginners]",
    preview:
      "Here are this week's five freeCodeCamp resources that are worth your time.",
    read: false,
    starred: false,
  },
];

export const calendarMonthLabel = "Сентябрь 2026 г.";
export const calendarWeekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const calendarWeeks: CalendarDay[][] = [
  [
    { date: 31, inCurrentMonth: false, events: [] },
    { date: 1, inCurrentMonth: true, events: [] },
    { date: 2, inCurrentMonth: true, events: [] },
    { date: 3, inCurrentMonth: true, events: [] },
    { date: 4, inCurrentMonth: true, events: [] },
    { date: 5, inCurrentMonth: true, events: [] },
    { date: 6, inCurrentMonth: true, events: [] },
  ],
  [
    { date: 7, inCurrentMonth: true, events: [] },
    {
      date: 8,
      inCurrentMonth: true,
      events: [],
    },
    {
      date: 9,
      inCurrentMonth: true,
      events: [{ id: "e1", title: "1:1 with mana...", time: "", color: "blue" }],
    },
    { date: 10, inCurrentMonth: true, events: [] },
    { date: 11, inCurrentMonth: true, events: [] },
    { date: 12, inCurrentMonth: true, events: [] },
    { date: 13, inCurrentMonth: true, events: [] },
  ],
  [
    {
      date: 14,
      inCurrentMonth: true,
      events: [{ id: "e2", title: "Client call", time: "", color: "orange" }],
    },
    { date: 15, inCurrentMonth: true, events: [] },
    { date: 16, inCurrentMonth: true, events: [] },
    {
      date: 17,
      inCurrentMonth: true,
      events: [{ id: "e3", title: "Sprint planning", time: "", color: "green" }],
    },
    { date: 18, inCurrentMonth: true, events: [] },
    {
      date: 12,
      inCurrentMonth: true,
      isToday: true,
      events: [
        { id: "e4", title: "Team standup", time: "09:00", color: "blue" },
        { id: "e5", title: "Design review", time: "14:00", color: "purple" },
      ],
    },
    { date: 20, inCurrentMonth: true, events: [] },
  ],
  [
    {
      date: 21,
      inCurrentMonth: true,
      events: [{ id: "e6", title: "Product demo", time: "", color: "purple" }],
    },
    { date: 22, inCurrentMonth: true, events: [] },
    { date: 23, inCurrentMonth: true, events: [] },
    {
      date: 24,
      inCurrentMonth: true,
      events: [
        { id: "e7", title: "Release day", time: "", color: "green" },
        { id: "e8", title: "Retro", time: "", color: "red" },
      ],
    },
    { date: 25, inCurrentMonth: true, events: [] },
    { date: 26, inCurrentMonth: true, events: [] },
    { date: 27, inCurrentMonth: true, events: [] },
  ],
];

export const selectedDay = {
  weekdayLabel: "СУББОТА",
  dateLabel: "12 сентября",
  events: [
    { id: "e4", title: "Team standup", time: "09:00", color: "blue" as const },
    { id: "e5", title: "Design review", time: "14:00", color: "purple" as const },
  ],
};

export const driveFolders: DriveFolder[] = [
  { id: "f1", name: "Project Assets" },
  { id: "f2", name: "Client Contracts" },
];

export const driveFiles: DriveFile[] = [
  {
    id: "d1",
    name: "Q3 Report.pdf",
    owner: "me",
    modified: "Yesterday",
    size: "2.4 MB",
    starred: true,
    kind: "pdf",
  },
  {
    id: "d2",
    name: "Meeting Notes.docx",
    owner: "me",
    modified: "3 days ago",
    size: "128 KB",
    kind: "doc",
  },
  {
    id: "d3",
    name: "Budget 2026.xlsx",
    owner: "Test User",
    modified: "Sep 2",
    size: "890 KB",
    kind: "sheet",
  },
];

export const notes: Note[] = [
  {
    id: "n1",
    title: "Футбол",
    updatedAt: "12 сент., 10:28",
    content: "Играть в pubg в 22:00",
  },
  {
    id: "n2",
    title: "Receipt",
    updatedAt: "12 сент., 10:26",
    content: "Shawarma carrot",
  },
  {
    id: "n3",
    title: "dashbdas",
    updatedAt: "8 сент., 16:10",
    content: "hdasbdn",
  },
];
