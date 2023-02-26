export type LivenessCheckState = {
    livenessState: string, // ["notStarted", "onGoing", "finished"]
    currentInstructionIndex: number,
};

export type LivenessCheckProps = { 
    userFace: string | null,
    onInstructionUpdate: CallableFunction,
    onDownloadPicturesClick: CallableFunction,
    onRestart: CallableFunction,
};
