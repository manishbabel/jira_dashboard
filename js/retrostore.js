class RetroStore {
    constructor(data) {
        this._data = data;
    }

    getSprintHappiness(sprint){
        let sprintId = sprint.id;
        sprintId = 5;
        const questions = Object.values(this.data[sprintId]);
        const avgScores = questions.map(question => this.getAvg(question));
        return this.getAvg(avgScores);
    }

    getAvg(array){
        return (array.reduce((prev, cur) => cur += prev)) / array.length;
    }

    get data(){return this._data;}
}

