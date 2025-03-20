
import { Video, VoiceOption } from "@/types";

export const mockVideos: Video[] = [
  {
    id: "1",
    finalVideoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    scriptText: "This is a sample video about the importance of mindfulness. Taking a few minutes each day to focus on your breathing can significantly reduce stress and improve mental clarity.",
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: "2",
    finalVideoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    scriptText: "Drinking enough water is essential for maintaining good health. Experts recommend consuming at least eight glasses of water daily to stay properly hydrated.",
    timestamp: Date.now() - 86400000,
  },
];

export const voiceOptions: VoiceOption[] = [
  { id: "NFG5qt843uXKj4pFvR7C", name: "Adam", description: "British male" },
  { id: "CBHdTdZwkV4jYoCyMV1B", name: "African American", description: "Female" },
  { id: "gYr8yTP0q4RkX1HnzQfX", name: "African American", description: "Male" },
  { id: "LXVY607YcjqxFS3mcult", name: "Alex", description: "Male" },
  { id: "ZF6FPAbjXT4488VcRRnw", name: "Amelia", description: "British female" },
  { id: "NYC9WEgkq1u4jiqBseQ9", name: "Announcer", description: "British man" },
  { id: "L0Dsvb3SLTyegXwtm47J", name: "Archer", description: "British male" },
  { id: "ZkXXWlhJO3CtSXof2ujN", name: "Ava", description: "American female" },
  { id: "kPzsL2i3teMYv0FxEYQ6", name: "Brittney", description: "American female" },
  { id: "ngiiW8FFLIdMew1cqwSB", name: "Chinese American", description: "Female" },
  { id: "gAMZphRyrWJnLMDnom6H", name: "Chinese American", description: "Male" },
  { id: "qNkzaJoHLLdpvgh5tISm", name: "Cowboy", description: "" },
  { id: "FVQMzxJGPUBtfz1Azdoy", name: "Danielle", description: "American female" },
  { id: "L5Oo1OjjHdbIvJDQFgmN", name: "Demon Bartholomeus", description: "" },
  { id: "vfaqCOvlrKi4Zp7C2IAm", name: "Demon Monster", description: "" },
];
