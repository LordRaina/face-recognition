export type CameraProps = {
    faceTracking: boolean,
    onFaceChange: CallableFunction,
    onPictureTaken: CallableFunction,
    shouldTakePicture: boolean,
};

export type Coordinates = {
    x: number,
    y: number,
    w: number,
    h: number,
}

export type DetectedState = {
    detected: number, 
    x: number,
    y: number, 
    s: number,
    rx: number,
    ry: number,
    expressions: Array[number]
};
