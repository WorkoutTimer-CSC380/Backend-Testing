export type Exercise = {
    readonly name: string,
    readonly time: number
}

export type Workout = {
    readonly name: string,
    readonly rounds: Exercise[]
}