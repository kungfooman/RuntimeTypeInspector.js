export class StaticAsyncMethod {
    static async test(a, b) {
        console.log("StaticAsyncMethod#test", {a, b});
    }
}
StaticAsyncMethod.test(1, 2);
