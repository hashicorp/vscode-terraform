
export interface InterpolationFunctionDefinition {
    name: string;
    description: string;
    parameters: string[];
};

export const KnownFunctions: InterpolationFunctionDefinition[] = [
    {
        name: "abs",
        description: "abs(float) - Returns the absolute value of a given float. Example: abs(1) returns 1, and abs(-1) would also return 1, whereas abs(-3.14) would return 3.14. See also the signum function.",
        parameters: ["float"]
    },
    {
        name: "basename",
        description: "basename(path) - Returns the last element of a path.",
        parameters: ["path"]
    },
    {
        name: 'base64decode',
        description: 'base64decode(string) - Given a base64-encoded string, decodes it and returns the original string.',
        parameters: ["string"]
    },
    {
        name: 'base64encode',
        description: 'base64encode(string) - Returns a base64-encoded representation of the given string.',
        parameters: ["string"]
    },
    {
        name: 'base64gzip',
        description: 'base64gzip(string) - Compresses the given string with gzip and then encodes the result to base64. This can be used with certain resource arguments that allow binary data to be passed with base64 encoding, since Terraform strings are required to be valid UTF-8.',
        parameters: ["string"]
    },
    {
        name: 'base64sha25',
        description: 'base64sha256(string) - Returns a base64-encoded representation of raw SHA-256 sum of the given string. This is not equivalent of base64encode(sha256(string)) since sha256() returns hexadecimal representation.',
        parameters: ["string"]
    },
    {
        name: 'base64sha51',
        description: 'base64sha512(string) - Returns a base64-encoded representation of raw SHA-512 sum of the given string. This is not equivalent of base64encode(sha512(string)) since sha512() returns hexadecimal representation.',
        parameters: ["string"]
    },
    {
        name: 'bcrypt',
        description: 'bcrypt(password, cost) - Returns the Blowfish encrypted hash of the string at the given cost. A default cost of 10 will be used if not provided.',
        parameters: ["password", "cost"]
    },
    {
        name: 'ceil',
        description: 'ceil(float) - Returns the least integer value greater than or equal to the argument.',
        parameters: ["float"]
    },
    {
        name: 'chomp',
        description: 'chomp(string) - Removes trailing newlines from the given string.',
        parameters: ["string"]
    },
    {
        name: 'chunklist',
        description: 'chunklist(list, size) - Returns the list items chunked by size. Examples:\nchunklist(aws_subnet.foo.*.id, 1): will outputs [["id1"], ["id2"], ["id3"]]\nchunklist(var.list_of_strings, 2): will outputs [["id1", "id2"], ["id3", "id4"], ["id5"]]',
        parameters: ["list", "size"]
    },
    {
        name: 'cidrhost',
        description: 'cidrhost(iprange, hostnum) - Takes an IP address range in CIDR notation and creates an IP address with the given host number. If given host number is negative, the count starts from the end of the range. For example, cidrhost("10.0.0.0/8", 2) returns 10.0.0.2 and cidrhost("10.0.0.0/8", -2) returns 10.255.255.254.',
        parameters: ["iprange", "hostnum"]
    },
    {
        name: 'cidrnetmask',
        description: 'cidrnetmask(iprange) - Takes an IP address range in CIDR notation and returns the address-formatted subnet mask format that some systems expect for IPv4 interfaces. For example, cidrnetmask("10.0.0.0/8") returns 255.0.0.0. Not applicable to IPv6 networks since CIDR notation is the only valid notation for IPv6.',
        parameters: ["iprange"]
    },
    {
        name: 'cidrsubnet',
        description: 'cidrsubnet(iprange, newbits, netnum) - Takes an IP address range in CIDR notation (like 10.0.0.0/8) and extends its prefix to include an additional subnet number. For example, cidrsubnet("10.0.0.0/8", 8, 2) returns 10.2.0.0/16; cidrsubnet("2607:f298:6051:516c::/64", 8, 2) returns 2607:f298:6051:516c:200::/72.',
        parameters: ["iprange", "newbits", "netnum"]
    },
    {
        name: 'coalesce',
        description: 'coalesce(string1, string2, ...) - Returns the first non-empty value from the given arguments. At least two arguments must be provided.',
        parameters: ["string1", "string2", "..."]
    },
    {
        name: 'coalescelist',
        description: 'coalescelist(list1, list2, ...) - Returns the first non-empty list from the given arguments. At least two arguments must be provided.',
        parameters: ["list1", "list2", "..."]
    },
    {
        name: 'compact',
        description: 'compact(list) - Removes empty string elements from a list. This can be useful in some cases, for example when passing joined lists as module variables or when parsing module outputs. Example: compact(module.my_asg.load_balancer_names)',
        parameters: ["list"]
    },
    {
        name: 'concat',
        description: 'concat(list1, list2, ...) - Combines two or more lists into a single list. Example: concat(aws_instance.db.*.tags.Name, aws_instance.web.*.tags.Name)',
        parameters: ["list1", "list2", "..."]
    },
    {
        name: 'contains',
        description: 'contains(list, element) - Returns true if a list contains the given element and returns false otherwise. Examples: contains(var.list_of_strings, "an_element")',
        parameters: ["list", "element"]
    },
    {
        name: 'dirname',
        description: 'dirname(path) - Returns all but the last element of path, typically the path\'s directory.',
        parameters: ["path"]
    },
    {
        name: 'distinct',
        description: 'distinct(list) - Removes duplicate items from a list. Keeps the first occurrence of each element, and removes subsequent occurrences. This function is only valid for flat lists. Example: distinct(var.usernames)',
        parameters: ["list"]
    },
    {
        name: 'element',
        description: 'element(list, index) - Returns a single element from a list at the given index. If the index is greater than the number of elements, this function will wrap using a standard mod algorithm. This function only works on flat lists. Examples:\nelement(aws_subnet.foo.*.id, count.index)\nelement(var.list_of_strings, 2)',
        parameters: ["list", "index"]
    },
    {
        name: 'file',
        description: 'file(path) - Reads the contents of a file into the string. Variables in this file are not interpolated. The contents of the file are read as-is. The path is interpreted relative to the working directory. Path variables can be used to reference paths relative to other base locations. For example, when using file() from inside a module, you generally want to make the path relative to the module base, like this: file("${path.module}/file").',
        parameters: ["path"]
    },
    {
        name: 'floor',
        description: 'floor(float) - Returns the greatest integer value less than or equal to the argument.',
        parameters: ["float"]
    },
    {
        name: 'flatten',
        description: 'flatten(list of lists) - Flattens lists of lists down to a flat list of primitive values, eliminating any nested lists recursively. Examples:\nflatten(data.github_user.user.*.gpg_keys)',
        parameters: ["list of lists"]
    },
    {
        name: 'format',
        description: 'format(format, args, ...) - Formats a string according to the given format. The syntax for the format is standard sprintf syntax. Good documentation for the syntax can be found here. Example to zero-prefix a count, used commonly for naming servers: format("web-%03d", count.index + 1).',
        parameters: ["format", "args", "..."]
    },
    {
        name: 'formatlist',
        description: 'formatlist(format, args, ...) - Formats each element of a list according to the given format, similarly to format, and returns a list. Non-list arguments are repeated for each list element. For example, to convert a list of DNS addresses to a list of URLs, you might use: formatlist("https://%s:%s/", aws_instance.foo.*.public_dns, var.port). If multiple args are lists, and they have the same number of elements, then the formatting is applied to the elements of the lists in parallel. Example: formatlist("instance %v has private ip %v", aws_instance.foo.*.id, aws_instance.foo.*.private_ip). Passing lists with different lengths to formatlist results in an error.',
        parameters: ["format", "args", "..."]
    },
    {
        name: 'indent',
        description: 'indent(numspaces, string) - Prepends the specified number of spaces to all but the first line of the given multi-line string. May be useful when inserting a multi-line string into an already-indented context. The first line is not indented, to allow for the indented string to be placed after some sort of already-indented preamble. Example: " \"items\": ${ indent(4, "[\n \"item1\"\n]") },"',
        parameters: ["numspaces", "string"]
    },
    {
        name: 'index',
        description: 'index(list, elem) - Finds the index of a given element in a list. This function only works on flat lists. Example: index(aws_instance.foo.*.tags.Name, "foo-test")',
        parameters: ["list", "elem"]
    },
    {
        name: 'join',
        description: 'join(delim, list) - Joins the list with the delimiter for a resultant string. This function works only on flat lists. Examples:\njoin(",", aws_instance.foo.*.id)\njoin(",", var.ami_list)',
        parameters: ["delim", "list"]
    },
    {
        name: 'jsonencode',
        description: 'jsonencode(value) - Returns a JSON-encoded representation of the given value, which can contain arbitrarily-nested lists and maps. Note that if the value is a string then its value will be placed in quotes.',
        parameters: ["value"]
    },
    {
        name: 'keys',
        description: 'keys(map) - Returns a lexically sorted list of the map keys.',
        parameters: ["map"]
    },
    {
        name: 'length',
        description: 'length(list) - Returns the number of members in a given list or map, or the number of characters in a given string. Examples:\n${length(split(",", "a,b,c"))} = 3\n${length("a,b,c")} = 5\n${length(map("key", "val"))} = 1',
        parameters: ["list"]
    },
    {
        name: 'list',
        description: 'list(items, ...) - Returns a list consisting of the arguments to the function. This function provides a way of representing list literals in interpolation. Examples:\n${list("a", "b", "c")} returns a list of "a", "b", "c".\n${list()} returns an empty list.',
        parameters: ["items", "..."]
    },
    {
        name: 'log',
        description: 'log(x, base) - Returns the logarithm of x.',
        parameters: ["x", "base"]
    },
    {
        name: 'lookup',
        description: 'lookup(map, key, [default]) - Performs a dynamic lookup into a map variable. The map parameter should be another variable, such as var.amis. If key does not exist in map, the interpolation will fail unless you specify a third argument, default, which should be a string value to return if no key is found in map. This function only works on flat maps and will return an error for maps that include nested lists or maps.',
        parameters: ["map", "key", "[default]"]
    },
    {
        name: 'lower',
        description: 'lower(string) - Returns a copy of the string with all Unicode letters mapped to their lower case.',
        parameters: ["string"]
    },
    {
        name: 'map',
        description: 'map(key, value, ...) - Returns a map consisting of the key/value pairs specified as arguments. Every odd argument must be a string key, and every even argument must have the same type as the other values specified. Duplicate keys are not allowed. Examples:\nmap("hello", "world")\nmap("us-east", list("a", "b", "c"), "us-west", list("b", "c", "d"))',
        parameters: ["key", "value", "..."]
    },
    {
        name: 'matchkeys',
        description: 'matchkeys(values, keys, searchset) - For two lists values and keys of equal length, returns all elements from values where the corresponding element from keys exists in the searchset list. E.g. matchkeys(aws_instance.example.*.id, aws_instance.example.*.availability_zone, list("us-west-2a")) will return a list of the instance IDs of the aws_instance.example instances in "us-west-2a". No match will result in empty list. Items of keys are processed sequentially, so the order of returned values is preserved.',
        parameters: ["values", "keys", "searchset"]
    },
    {
        name: 'max',
        description: 'max(float1, float2, ...) - Returns the largest of the floats.',
        parameters: ["float1", "float2", "..."]
    },
    {
        name: 'merge',
        description: 'merge(map1, map2, ...) - Returns the union of 2 or more maps. The maps are consumed in the order provided, and duplicate keys overwrite previous entries. Examples:\n${merge(map("a", "b"), map("c", "d"))} returns {"a": "b", "c": "d"}',
        parameters: ["map1", "map2", "..."]
    },
    {
        name: 'min',
        description: 'min(float1, float2, ...) - Returns the smallest of the floats.',
        parameters: ["float1", "float2", "..."]
    },
    {
        name: 'md5',
        description: 'md5(string) - Returns a (conventional) hexadecimal representation of the MD5 hash of the given string.',
        parameters: ["string"]
    },
    {
        name: 'pathexpand',
        description: 'pathexpand(string) - Returns a filepath string with ~ expanded to the home directory. Note: This will create a plan diff between two different hosts, unless the filepaths are the same.',
        parameters: ["string"]
    },
    {
        name: 'pow',
        description: 'pow(x, y) - Returns the base x of exponential y as a float. Examples:\n${pow(3,2)} = 9\n${pow(4,0)} = 1 ',
        parameters: ["x", "y"]
    },
    {
        name: 'replace',
        description: 'replace(string, search, replace) - Does a search and replace on the given string. All instances of search are replaced with the value of replace. If search is wrapped in forward slashes, it is treated as a regular expression. If using a regular expression, replace can reference subcaptures in the regular expression by using $n where n is the index or name of the subcapture. If using a regular expression, the syntax conforms to the re2 regular expression syntax.',
        parameters: ["string", "search", "replace"]
    },
    {
        name: 'rsadecrypt',
        description: 'rsadecrypt(string, key) - Decrypts string using RSA. The padding scheme PKCS #1 v1.5 is used. The string must be base64-encoded. key must be an RSA private key in PEM format. You may use file() to load it from a file.',
        parameters: ["string", "key"]
    },
    {
        name: 'sha1',
        description: 'sha1(string) - Returns a (conventional) hexadecimal representation of the SHA-1 hash of the given string. Example: "${sha1("${aws_vpc.default.tags.customer}-s3-bucket")}"',
        parameters: ["string"]
    },
    {
        name: 'sha256',
        description: 'sha256(string) - Returns a (conventional) hexadecimal representation of the SHA-256 hash of the given string. Example: "${sha256("${aws_vpc.default.tags.customer}-s3-bucket")}"',
        parameters: ["string"]
    },
    {
        name: 'sha512',
        description: 'sha512(string) - Returns a (conventional) hexadecimal representation of the SHA-512 hash of the given string. Example: "${sha512("${aws_vpc.default.tags.customer}-s3-bucket")}"',
        parameters: ["string"]
    },
    {
        name: 'signum',
        description: 'signum(integer) - Returns -1 for negative numbers, 0 for 0 and 1 for positive numbers. This function is useful when you need to set a value for the first resource and a different value for the rest of the resources. Example: element(split(",", var.r53_failover_policy), signum(count.index)) where the 0th index points to PRIMARY and 1st to FAILOVER',
        parameters: ["integer"]
    },
    {
        name: 'slice',
        description: 'slice(list, from, to) - Returns the portion of list between from (inclusive) and to (exclusive). Example: slice(var.list_of_strings, 0, length(var.list_of_strings) - 1)',
        parameters: ["list", "from", "to"]
    },
    {
        name: 'sort',
        description: 'sort(list) - Returns a lexographically sorted list of the strings contained in the list passed as an argument. Sort may only be used with lists which contain only strings. Examples: sort(aws_instance.foo.*.id), sort(var.list_of_strings)',
        parameters: ["list"]
    },
    {
        name: 'split',
        description: 'split(delim, string) - Splits the string previously created by join back into a list. This is useful for pushing lists through module outputs since they currently only support string values. Depending on the use, the string this is being performed within may need to be wrapped in brackets to indicate that the output is actually a list, e.g. a_resource_param = ["${split(",", var.CSV_STRING)}"]. Example: split(",", module.amod.server_ids)',
        parameters: ["delim", "string"]
    },
    {
        name: 'substr',
        description: 'substr(string, offset, length) - Extracts a substring from the input string. A negative offset is interpreted as being equivalent to a positive offset measured backwards from the end of the string. A length of -1 is interpreted as meaning "until the end of the string".',
        parameters: ["string", "offset", "length"]
    },
    {
        name: 'timestamp',
        description: 'timestamp() - Returns a UTC timestamp string in RFC 3339 format. This string will change with every invocation of the function, so in order to prevent diffs on every plan & apply, it must be used with the ignore_changes lifecycle attribute.',
        parameters: []
    },
    {
        name: 'timeadd',
        description: 'timeadd(time, duration) - Returns a UTC timestamp string corresponding to adding a given duration to time in RFC 3339 format. For example, timeadd("2017-11-22T00:00:00Z", "10m") produces a value "2017-11-22T00:10:00Z".',
        parameters: ["time", "duration"]
    },
    {
        name: 'title',
        description: 'title(string) - Returns a copy of the string with the first characters of all the words capitalized.',
        parameters: ["string"]
    },
    {
        name: 'transpose',
        description: 'transpose(map) - Swaps the keys and list values in a map of lists of strings. For example, transpose(map("a", list("1", "2"), "b", list("2", "3")) produces a value equivalent to map("1", list("a"), "2", list("a", "b"), "3", list("b")).',
        parameters: ["map"]
    },
    {
        name: 'trimspace',
        description: 'trimspace(string) - Returns a copy of the string with all leading and trailing white spaces removed.',
        parameters: ["string"]
    },
    {
        name: 'upper',
        description: 'upper(string) - Returns a copy of the string with all Unicode letters mapped to their upper case.',
        parameters: ["string"]
    },
    {
        name: 'urlencode',
        description: 'urlencode(string) - Returns an URL-safe copy of the string.',
        parameters: ["string"]
    },
    {
        name: 'uuid',
        description: 'uuid() - Returns a UUID string in RFC 4122 v4 format. This string will change with every invocation of the function, so in order to prevent diffs on every plan & apply, it must be used with the ignore_changes lifecycle attribute.',
        parameters: []
    },
    {
        name: 'values',
        description: 'values(map) - Returns a list of the map values, in the order of the keys returned by the keys function. This function only works on flat maps and will return an error for maps that include nested lists or maps.',
        parameters: ["map"]
    },
    {
        name: 'zipmap',
        description: 'zipmap(list, list) - Creates a map from a list of keys and a list of values. The keys must all be of type string, and the length of the lists must be the same. For example, to output a mapping of AWS IAM user names to the fingerprint of the key used to encrypt their initial password, you might use: zipmap(aws_iam_user.users.*.name, aws_iam_user_login_profile.users.*.key_fingerprint).',
        parameters: ["list", "list"]
    }
];

export function GetKnownFunctions(name?: string): InterpolationFunctionDefinition[] {
    if (!name || name === "")
        return KnownFunctions;

    return KnownFunctions.filter((f) => !!f.name.match(name));
}