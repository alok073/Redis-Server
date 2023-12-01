import { RespArray } from './types';

export interface IRedisSerializer {
    /**
     * This function serializes a given object.
     * The input should be of a valid RESP Type.
     *
     * @param {unknown} input
     * @param {boolean} useBulkString - Uses bulk strings to serialize instead of using simple strings
     * @returns {string}
     */
    serialize(input: any, useBulkString?: boolean): string;
  
    /**
     * This function is used to serialize strings.
     * The strings can have any binary supported character.
     *
     * @param {(string | null)} input
     * @returns {string}
     */
    serializeBulkStrings(input: string | null): string;
}

export class RedisSerializer implements IRedisSerializer {

    // serialize(input: any, useBulkString?: boolean): string {
    //     const type = this.determineType(input);
    
    //     if (type in this.serializeFunctions) {
    //       return this.serializeFunctions[type](input, useBulkString);
    //     }
    
    //     throw new Error('Invalid input');
    // }

    serialize(input: unknown, useBulkString?: boolean): string {
      if (input === null) {
        return this.serializeNull();
      } 
      if (typeof input === 'string') {
        const serializedString = useBulkString === true ? this.serializeBulkStrings(input) : this.serializeSimpleString(input);
        return serializedString;
      }
      if (typeof input === 'number') {
        return this.serializeInteger(input);
      }
      if (Array.isArray(input) && isARespType(input)) {
        return this.serializeArrays(input, useBulkString);
      }
      if (input instanceof Error) {
        return this.serializeError(input);
      }
      throw new Error('Invalid input');
    }
  
    serializeBulkStrings(input: string): string {
      return `$${input.length}\r\n${input}\r\n`;
    }

    // private serializeFunctions: { [key: string]: (input: any, useBulkString?: boolean) => string } = {
    //     null: this.serializeNull.bind(this),
    //     string: this.serializeString.bind(this),
    //     number: this.serializeInteger.bind(this),
    //     array: this.serializeArrays.bind(this),
    //     error: this.serializeError.bind(this),
    // };

    // private determineType(input: any): string {
    //     const typeMap: { [key: string]: string } = {
    //       null: 'null',
    //       string: 'string',
    //       number: 'number',
    //       array: Array.isArray(input) && isARespType(input) ? 'array' : 'invalid',
    //       error: input instanceof Error ? 'error' : 'invalid',
    //     };
      
    //     return typeMap.hasOwnProperty(input) ? typeMap[input] : 'invalid';
    // }

    private serializeString(input: string, useBulkString?: boolean) {
      const serializedString = useBulkString === true ? this.serializeBulkStrings(input) : this.serializeSimpleString(input);
      return serializedString;
    }
  
    private serializeError(err: Error): string {
      return `-${err.message}\r\n`;
    }
  
    private serializeInteger(input: number): string {
      if (Math.floor(input) !== input) {
        throw new Error(`Invalid integer ${input}`);
      }
      return `:${input}\r\n`;
    }
  
    private serializeSimpleString(input: string): string {
      if (input.indexOf('\r') > 0 || input.indexOf('\n') > 0) {
        throw new Error('Simple string contains CR or LF character');
      }
      return '+' + input + '\r\n';
    }
  
    private serializeNull(): string {
      return '$-1\r\n';
    }
  
    private serializeArrays(input: RespArray, useBulkString?: boolean): string {
      if (input === null) {
        return '*-1\r\n';
      }
      let str = '*' + input.length + '\r\n';
      for (let i = 0; i < input.length; i++) {
        str += this.serialize(input[i], useBulkString);
      }
      return str;
    }
}

/**
 * This function checks whether the input has a valid RESP Type.
 * If the input provided is a nested data structure, it recursively checks all the elements.
 *
 * @param {any} input
 * @returns {boolean}
 */
function isARespType(input: any): boolean {
    const typeofInput = typeof input;
  
    // If the input is of type string, number, null, or Error.
    if (
      typeofInput === 'string' ||
      typeofInput === 'number' ||
      input === null ||
      input instanceof Error
    ) {
      return true;
    }
  
    // If the input is an Array.
    if (Array.isArray(input)) {
      let isValid = true;
      for (const elem in input) {
        // check wether each element is a valid RESP Type or not.
        isValid = isValid && isARespType(elem);
        if (!isValid) {
          return false;
        }
      }
      return isValid;
    }
    return false;
  }