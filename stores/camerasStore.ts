import { Camera } from '@/types';

export const MOCK_CAMERAS: Camera[] = [
    {
        id: "01",
        name: "Living Room",
        status: "online",
        location: "Living Room"
    },
    {
        id: "02",
        name: "Backyard",
        status: "online",
        location: "Backyard Door"
    },
    {
        id: "03",
        name: "Front Door",
        status: "online",
        location: "Front Door"
    },
]

export const addCamera = (camera : Camera) => {
    MOCK_CAMERAS.push(camera);
}

export const updateCamera = (camera : Camera) => {
    const index = MOCK_CAMERAS.findIndex( c => c.id == camera.id);
    if(index != -1) {
        MOCK_CAMERAS[index] = camera;
    }
}

export const getCameraById = (id : string) => {
    return MOCK_CAMERAS.find( c => c.id == id);
}

export const deleteCamera = (id : string) => {
    const index = MOCK_CAMERAS.findIndex( c => c.id == id);
    if(index != -1) {
        MOCK_CAMERAS.splice(index, 1);
    }
}