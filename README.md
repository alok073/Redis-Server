# Redis-Server


### Serialize

- REdis Serialization Protocol (RESP) is a protocol that we can use to communicate with the Redis server
- RESP can serialize different data types including integers, strings, and arrays.
- A client sends a request to the Redis server as an array of strings. The array's contents are the command and its arguments that the server should execute.
- The first byte in an RESP-serialized payload always identifies its type. Subsequent bytes constitute the type's contents.
- The *carriage return* (`\r`) and the *line feed* (`\n`) combined together is known as CRLF (`\r\n`), is the protocol's terminator, which always separates its parts.


#### **The request types implemented are :-**

##### 1. Simple strings
- The response for a simple string is : `+${input}\r\n`
- Input : `Hello` 
- Output : `+Hello\r\n`
- *Note* : Simple string inputs should not contain CRLF terminators

##### 2. Bulk strings
- A bulk string represents a single binary string. The string can be of any size, but by default, Redis limits it to 512 MB
- The response for a bulk string is : `$${input.length}\r\n${input}\r\n`
- Input : `Hello` 
- Output : `$5\r\nHello\r\n`

##### 3. Null
- The response for a null is : `$-1\r\n`

##### 4. Integer
- Integers are signed, base-10, 64 bit
- Integer input cannot contain decimals
- The response for an Integer is : `:${input}\r\n`
- Input : `12`
- Output : `:12\r\n`

##### 5. Error
- The response for an error is : `-${err.message}\r\n`

##### 6. Arrays
- The response for an Array is : `*${input.length}\r\n`. 
- After this append the response of each type present in the array
- The `input.length` is the length of the array


### De-serialize

- De-serializing is just the reverse of serializing the input.
- Here we go through the serialized input, parse it on the basis of the type and return the original value
- The first byte of the serialized input always denotes the type of the input.


### Redis Server

- To create a server we will be using the `net` module of NodeJS. It requires us to specify a host and a port to start the server.
- We will be running our server on localhost at port 6379.
- The task of this server is to open up a socket connection, receive commands along with the serialized data which adheres to the RESP protocol, de-serialize it and return the response.
- Our server supports following commands :
    1. `PING` : We return PONG as the output for this command.
    2. `ECHO` : We return back the input data passed along with the command.
    3. `SET` : We set the key-value pair in a Map data structure created locally inside the Server class.
    4. `GET` : We return the value corresponding to the key from the Map data structure as a response
    5. `DELETE` : We delete the the given key from the Map and return either 1 or 0 depending if the Key passed is valid or not.
- To create Redis Clients that can talk to our server, we are using the `redis` package that allows us to create multiple clients and send commands in parallel.