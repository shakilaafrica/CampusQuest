/**
 * Campus Quest missions, in play order. Single source of truth on the client.
 * The ids MUST match `public.mission_order()` in supabase/migrations/001_campus_quest_init.sql.
 * Map positions (x, y) are percentages across the campus map image.
 */
export const MISSIONS = [
  {
    id: 'jammie_rush',
    title: 'Jammie Rush',
    page: 'missions/jammie/index.html',
    completeLabel: 'Jammie Rush complete',
    x: 84,
    y: 45,
    desc: 'Make your way to the Jammie stop, navigate the route to Hiddingh Campus, and survive the Jammie Rush. Learn how to use the campus shuttle system before time runs out!',
  },
  {
    id: 'wellness_services',
    title: 'Student Wellness Services Wanted',
    page: 'missions/wellness/index.html',
    completeLabel: 'Wellness mission complete',
    x: 63,
    y: 25,
    desc: 'Kirah needs your help. Navigate across campus, find her, and discover where Student Wellness Services is located and how it can support you.',
  },
  {
    id: 'society_fair',
    title: 'Society Fair',
    page: 'missions/society/index.html',
    completeLabel: 'Society Fair complete',
    x: 36,
    y: 73,
    desc: 'Head to the Society Fair and explore campus life beyond lectures. Meet the societies, complete their challenges, and find a community that matches your interests.',
  },
  {
    id: 'student_card',
    title: 'Operation: Student Card',
    page: 'missions/student-card/index.html',
    completeLabel: 'Student Card mission complete',
    x: 78,
    y: 78,
    desc: 'Your final orientation task is to secure your student card. Navigate to the correct campus service, complete the process, and unlock your official access to campus.',
  },
] as const;

export type Mission = (typeof MISSIONS)[number];
export type MissionId = Mission['id'];

export const MISSION_IDS: readonly MissionId[] = MISSIONS.map((m) => m.id);

export function isMissionId(value: string): value is MissionId {
  return (MISSION_IDS as readonly string[]).includes(value);
}

export function missionTitle(id: string): string {
  return MISSIONS.find((m) => m.id === id)?.title ?? id;
}
