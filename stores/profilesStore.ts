import { Profile } from '@/types';

export const MOCK_PROFILES: Profile[] = [
    {
        id: "01",
        displayName: "Kevin",
        confidenceThreshold: 0.8,
        lastSeen: {
            date: "2025-12-07",
            time: "00:07:46",
            cameraId: "01"
        },
        labels: [
            "Student", "Software Engineer"
        ]
    },
    {
        id: "02",
        displayName: "Batyr",
        confidenceThreshold: 0.8,
        lastSeen: {
            date: "2025-12-06",
            time: "22:07:41",
            cameraId: "03"
        },
        labels: [
            "Student", "Software Engineer"
        ]
    },
    {
        id: "03",
        displayName: "Yoselin",
        confidenceThreshold: 0.8,
        lastSeen: {
            date: "2025-12-05",
            time: "00:07:41",
            cameraId: "02"
        },
        labels: [
            "Student", "Software Engineer"
        ]
    },
    {
        id: "04",
        displayName: "Ethan",
        confidenceThreshold: 0.8,
        lastSeen: {
            date: "2025-12-05",
            time: "00:07:41",
            cameraId: "01"
        },
        labels: [
            "Student", "Software Engineer"
        ]
    },
    {
        id: "05",
        displayName: "Prof. Hughes",
        confidenceThreshold: 0.8,
        lastSeen: {
            date: "2025-12-05",
            time: "00:07:41",
            cameraId: "01"
        },
        labels: [
            "Professor", "Software Engineer"
        ],
        description: "Project Mentor"
    },
];

export const addProfile = (profile: Profile) => {
    MOCK_PROFILES.push(profile);
};

export const updateProfile = (profile: Profile) => {
    const index = MOCK_PROFILES.findIndex(p => p.id === profile.id);
    if (index !== -1) {
        MOCK_PROFILES[index] = profile;
    }
};

export const findProfileById = (id: string) => {
    return MOCK_PROFILES.find(p => p.id === id);
};

export const removeProfile = (id: string) => {
    const index = MOCK_PROFILES.findIndex(p => p.id === id);
    if (index !== -1) {
        MOCK_PROFILES.splice(index, 1);
    }
};

