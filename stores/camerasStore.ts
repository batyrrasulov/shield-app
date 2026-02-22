import { Camera } from '@/types';

export const MOCK_CAMERAS: Camera[] = [
    {
        id: "01",
        name: "Living Room",
        status: "online",
        location: "Living Room",
        streamRef: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
        id: "02",
        name: "Backyard",
        status: "online",
        location: "Backyard Door",
        streamRef: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
    },
    {
        id: "03",
        name: "Front Door",
        status: "online",
        location: "Front Door",
        streamRef: "https://test-streams.mux.dev/pts_shift/master.m3u8"
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