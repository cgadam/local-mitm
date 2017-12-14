# Local "Man in the Middle" (MITM)

The aim of this package is to act as a "man in the middle" between a client and a server. The basic logic flow goes like this: 
- If the incoming request's url matches some regExp provided by some of the rules in the **rules.json** file, then the MITM server will return the **hardcoded response** stated in the rule.
- If the incoming request's url doesn't match any rule, then MITM server will return the **real response** provided by the target server.

Note: the **headers** are always provided by **the real server**. The only header that is always modified is *content-length* (in case the request's url matches a rule)

You can also modify the statusCode if neccessary.

# Installation

        npm install -g local-mitm

You can then use local-mitm as a standalone command.

# Configuration

## The config file
The **config.json** file holds the configuration you need to set up this MITM server.

```javascript
{
    "interceptorPort": 3000, // The port in which the MITM server will be listening to. 
    "target": { // Info related to the actual target
        "host": "http://your-real-endpoint", //The real endpoint
        "port": 80 // The real endpoint port
    }
}
```

By default, the program will look for a file called "config.json" in the current working dir. (the path where the process was started).

Additionally, the *config.json* file can be set using the **LOCAL_MITM_CONFIG** env variable.

## The rules file
The rules stated in the **rules.json** file provide the *core functionality* of this module. The rules say wether for a given request a harcoded response should be provided or not.

The rules.json file must contain an Array of rules.

A rule looks like this:

```javascript
[
    {
        "regexp": ".*/hello", // The matching regexp. If a request's url matches this regexp this rule will apply
        "response": { // The actual response you want to provide. It can be plain text or a JSON object.
            "message": "Hello You!"
        },
        "statusCode": 200 // The status code (in case you want to override the original one) (Optional)
    }
]
```

By default, the program will look for a file called "rules.json" in the current working dir. (the path where the process was started).

Additionally, the rules.json file can be set using the **LOCAL_MITM_RULES_FILE** env variable.

# Samples

## Non-standalone samples

As the following samples will be using the module itself instead of the standalone command please firt do: 

    npm install

In samples folder you will find the working samples. The only difference in the sample is the type of response: *text/plain* versus *application/json*.

Let´s take the sample **json** as an example:
        
        cd samples/json
        node jsonHello.js

You will see something like this:

    [LOCAL-MITM] - Version: 1.0.0
    [LOCAL-MITM] - Using config file located at /Users/cgadam/Github/local-mitm/samples/json/config.json
    [LOCAL-MITM] - Using rules file located at /Users/cgadam/Github/local-mitm/samples/json/rules.json
    [LOCAL-MITM] - Target: http://localhost:9000
    [LOCAL-MITM] - Local Mitm server listening to 9001
    [LOCAL-SERVER] - Local server listening to 9000

    WELCOME TO THE DEMO!
    ********************
    Do the following GET requests in a browser to understand how this works!:
    - http://localhost:9000/?name=Pedro // Original server, original response
    - http://localhost:9001/?name=Pedro // MITM server, original response
    - http://localhost:9000/?name=Matias // Original server, original response
    - http://localhost:9001/?name=Matias // MITM server, hardcoded response

This means that the **target** server is running in the **9000** port and the **local mitm** server is running in the **9001** port.

Try this:

    $ curl http://localhost:9000
    {"message":"Hello World!"}

Nice, the **target** server returns "Hello World!" message by default.

Let's add a name now:

    $ curl http://localhost:9000/?name=Pedro
    {"message":"Hello Pedro!"}

Nice! It shows the name of the person you want to greet.

Now try the same but with **9001** port. You should get the exact same responses!

But let's try a particular case now. Try:

    $ curl http://localhost:9000/?name=Matias
    {"message":"Hello Matias!"}

What happens if you do the same using the MITM server instead?

    $ curl http://localhost:9001/?name=Matias
    {"message":"Hi Pona!"}

Voilà! The response has been intercepted and the pre-configured response was returned.

You'll see in the console all the different logs that the MITM server logged during the entire execution.

# Using Standalone

Just run:

    local-mitm

In the folder where **config.json** and **rules.json** files are located and the server will start automatically!

If you want to execute files located in other folders, all you need to do is to configure the two env vars explained before and launch local-mitm as a standalone command!

    $LOCAL_MITM_CONFIG="./samples/standalone/config.json" LOCAL_MITM_RULES_FILE="./samples/standalone/rules.json" local-mitm

Voilà! You can now point your services to the local-mitm server instead of the original endpoint!

### Important
If no config.json and/or rules.json file is found, the MITM server will fail.

# Useful for

- Intercepting the communication between two microservices (instead of having to debug the point in which the actual response comes). You can understand better the "contract" they have. (You can see the original request and the response logged into the console)

- Try out "what would happen" if the microservice we consume responds in a different way. (Useful for testing of responses already not implemented by the microservice you consume).

# License
Released under the MIT License.

# Based on..
[http-proxy](https://www.npmjs.com/package/http-proxy)