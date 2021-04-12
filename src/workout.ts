// NOTE: For now Workouts are just a sequence of "Rounds"
export type Round = {
    readonly name: string,
    readonly time: number
};

export type Workout = {
    readonly name: string,
    readonly rounds: Round[]
};