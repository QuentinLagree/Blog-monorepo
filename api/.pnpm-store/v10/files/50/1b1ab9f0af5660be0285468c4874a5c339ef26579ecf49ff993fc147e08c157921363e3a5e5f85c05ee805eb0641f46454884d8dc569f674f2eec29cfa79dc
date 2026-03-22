"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMock = void 0;
const globals_1 = require("@jest/globals");
const jestFnProps = new Set([
    '_isMockFunction',
    'mock',
    'mockClear',
    'mockImplementation',
    'mockImplementationOnce',
    'mockName',
    'getMockName',
    'getMockImplementation',
    'mockRejectedValue',
    'mockRejectedValueOnce',
    'mockReset',
    'mockResolvedValue',
    'mockResolvedValueOnce',
    'mockRestore',
    'mockReturnThis',
    'mockReturnValue',
    'mockReturnValueOnce',
    'withImplementation',
    'calls',
]);
const createProxy = (name, base) => {
    const cache = new Map();
    const handler = {
        get: (obj, prop, receiver) => {
            const propName = prop.toString();
            if (prop === 'inspect' ||
                prop === 'then' ||
                prop === 'asymmetricMatch' ||
                (typeof prop === 'symbol' && propName === 'Symbol(util.inspect.custom)')) {
                return undefined;
            }
            if (!base && jestFnProps.has(propName)) {
                return Reflect.get(obj, prop, receiver);
            }
            if (cache.has(prop)) {
                return cache.get(prop);
            }
            const checkProp = obj[prop];
            let mockedProp;
            if (prop in obj) {
                mockedProp =
                    typeof checkProp === 'function' ? globals_1.jest.fn(checkProp) : checkProp;
            }
            else if (prop === 'constructor') {
                mockedProp = () => undefined;
            }
            else {
                mockedProp = createProxy(`${name}.${propName}`);
            }
            cache.set(prop, mockedProp);
            return mockedProp;
        },
        set: (obj, prop, newValue) => {
            cache.set(prop, newValue);
            return Reflect.set(obj, prop, newValue);
        },
    };
    if (!base) {
        handler.apply = (target, thisArg, argsArray) => {
            const result = Reflect.apply(target, thisArg, argsArray);
            if (target.getMockImplementation() || result !== undefined) {
                return result;
            }
            else {
                if (!cache.has('__apply')) {
                    cache.set('__apply', createProxy(name));
                }
                return cache.get('__apply');
            }
        };
    }
    return new Proxy(base || globals_1.jest.fn(), handler);
};
const createMock = (partial = {}, options = {}) => {
    const { name = 'mock' } = options;
    const proxy = createProxy(name, partial);
    return proxy;
};
exports.createMock = createMock;
//# sourceMappingURL=mocks.js.map