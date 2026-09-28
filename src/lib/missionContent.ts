export interface MissionContent {
  number: 1 | 2 | 3 | 4;
  title: string;
  short: string;
  badge: string;
  skills: string[];
  celebration: string;
}

// Skills/badges are drawn from what each mission actually teaches/does,
// per Level ownership rules: Jammie Rush and Society Fair are owned by this
// task; Student Wellness Services Wanted (Level 2) and Operation: Student
// Card (Level 4) were inspected but NOT rewritten — their copy below just
// reflects their existing content, it doesn't invent new claims.
export const MISSION_CONTENT: MissionContent[] = [
  {
    number: 1,
    title: 'Jammie Rush',
    short: 'Navigate to the Jammie stop and survive the shuttle rush to Hiddingh Campus.',
    badge: 'CAMPUS NAVIGATOR',
    skills: ['Campus navigation', 'Shuttle awareness', 'Time management'],
    celebration: "You've completed your first Campus Quest mission.",
  },
  {
    number: 2,
    title: 'Student Wellness Services Wanted',
    short: 'Find Kirah and help her get to Student Wellness Services at Ivan Toms.',
    badge: 'WELLNESS GUIDE',
    skills: ['Finding Student Wellness Services', 'Supporting a fellow student', 'Campus wayfinding'],
    celebration: 'You helped Kirah reach Student Wellness Services and learned where to go if you ever need support.',
  },
  {
    number: 3,
    title: 'Society Fair',
    short: 'Explore campus societies and find where you belong.',
    badge: 'SOCIETY EXPLORER',
    skills: ['Campus involvement', 'Finding student communities', 'Exploring new interests'],
    celebration: 'You explored campus societies and discovered new ways to get involved in university life.',
  },
  {
    number: 4,
    title: 'Operation: Student Card',
    short: 'Head to Access Control, get your photo taken, and collect your UCT student card.',
    badge: 'CARD CARRIER',
    skills: ['Navigating campus admin', 'Getting your student card', 'Official campus access'],
    celebration: 'Your UCT Student Card is official — you now have full access to campus life.',
  },
];

export function missionContent(missionNumber: number): MissionContent {
  return MISSION_CONTENT[Math.min(Math.max(missionNumber - 1, 0), 3)];
}
