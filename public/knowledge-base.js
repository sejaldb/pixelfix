window.PIXELFIX_KNOWLEDGE = [
  {
    name: 'ModuleNotFoundError',
    pattern: /ModuleNotFoundError|No module named/i,
    cause: 'Python cannot find the named module in the environment running your script.',
    actions: [
      'Install the missing package into the same environment that runs your program.',
      'Check which interpreter is active with `python -m pip show <package>`.',
      'If using a virtual environment, activate it before installing and running.'
    ],
    expected: 'The package is available to the active interpreter and the import succeeds.'
  },
  {
    name: 'SyntaxError',
    pattern: /SyntaxError|invalid syntax|unexpected token/i,
    cause: 'The parser found code that does not match the language grammar, often near the reported line.',
    actions: [
      'Inspect the reported line and the line immediately before it.',
      'Check matching brackets, quotes, colons, indentation, and separators.',
      'Run the parser or formatter again after correcting the syntax.'
    ],
    expected: 'The file parses without a syntax error.'
  },
  {
    name: 'NameError',
    pattern: /NameError|is not defined|undefined variable/i,
    cause: 'Code refers to a name that has not been defined in the current scope.',
    actions: [
      'Check spelling and capitalization of the name at the reported location.',
      'Define or import it before use, and confirm it is in scope.',
      'Check whether a conditional branch or function call is expected to create it.'
    ],
    expected: 'The referenced name is defined before the failing statement runs.'
  },
  {
    name: 'TypeError',
    pattern: /TypeError|not a function|unsupported operand|cannot read propert/i,
    cause: 'An operation or function received a value of an incompatible type or shape.',
    actions: [
      'Inspect the full traceback and identify the exact operation that failed.',
      'Check the runtime types and values of its inputs near that line.',
      'Validate or convert inputs before calling the operation.'
    ],
    expected: 'The operation receives values in the type and shape it expects.'
  },
  {
    name: 'FileNotFoundError',
    pattern: /FileNotFoundError|No such file or directory/i,
    cause: 'The requested path does not resolve to a file from the process working directory.',
    actions: [
      'Print or inspect the current working directory.',
      'Check the exact path, spelling, capitalization, and whether the file exists.',
      'Prefer a path built relative to the script or an explicitly configured absolute path.'
    ],
    expected: 'The path resolves to an existing file with the expected permissions.'
  },
  {
    name: 'HTTP 404',
    pattern: /\b404\b|Not Found|does not exist at this URL/i,
    cause: 'The requested server route or resource was not found at that URL.',
    actions: [
      'Check the request URL, route, API version, and path capitalization.',
      'Confirm the resource exists and the server is serving the expected deployment.',
      'Check whether a trailing slash, base path, or route prefix is required.'
    ],
    expected: 'The request targets a valid route and returns the expected resource.'
  },
  {
    name: 'Connection refused',
    pattern: /ECONNREFUSED|connection refused|actively refused/i,
    cause: 'The client could not open a connection because no service accepted it at the target address and port.',
    actions: [
      'Confirm the target service is running and listening on the expected port.',
      'Check the hostname, port, container port mapping, and local firewall rules.',
      'Retry after the service has completed startup.'
    ],
    expected: 'A connection can be established and the target service responds.'
  }
];
