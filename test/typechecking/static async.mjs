export class StaticAsyncMethod {
    static async test(a = 1, b = 2) {
        console.log("StaticAsyncMethod#test", {a, b});
    }
}
StaticAsyncMethod.test(1, 2);
