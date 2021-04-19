export class Timer{
    time : number;
    startTime : number

    constructor(time : number){
        this.time = time;
        this.startTime = time;
    }

    sleep(ms : number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startWorkout(){
        while(this.time !== 0){
            this.sleep(1000)
            this.time = this.time - 1;
        }
    }

    getTimer(){
        return this;
    }

    restartTimer(){
        this.time = this.startTime;
    }
}