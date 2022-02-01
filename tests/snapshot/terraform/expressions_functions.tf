# numeric

abs(23)
ceil(5)
floor(5)
log(50, 10)
max(12, 54, 3)
min(12, 54, 3)
parseint("100", 10)
pow(3, 2)
signum(-13)

# string

chomp("hello\n")
format("Hello, %s!", "Ander")
formatlist("Hello, %s!", ["Valentina", "Ander", "Olivia", "Sam"])
formatlist("%s, %s!", "Salutations", ["Valentina", "Ander", "Olivia", "Sam"])
"  items: ${indent(2, "[\n  foo,\n  bar,\n]\n")}"
join(", ", ["foo", "bar", "baz"])
lower("HELLO")
regex("[a-z]+", "53453453.345345aaabbbccc23454")
regexall("[a-z]+", "1234abcd5678efgh9")
replace("1 + 2 + 3", "+", "-")
split(",", "foo,bar,baz")
strrev("hello")
substr("hello world", 1, 4)
title("hello world")
trim("?!hello?!", "!?")
trimprefix("helloworld", "hello")
trimsuffix("helloworld", "world")
trimspace("  hello\n\n")
upper("hello")
