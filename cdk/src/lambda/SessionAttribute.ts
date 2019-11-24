

export class SessionAttributes {

    private data:{answer: number[]} = {answer:[]}
 
    import(data: any) {
      if (data) {
        this.data = JSON.parse(data);
      }
    }
 
    export(){
      return JSON.stringify(this.data);
    }
 
    get index() {
      return this.data.answer.length;
    }
 
    get answer() {
      return this.data.answer;
    }
 
    appendAnswer(num: number) {
      this.data.answer.push(num);
    }
}