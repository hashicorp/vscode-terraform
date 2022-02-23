; SYNTAX TEST "source.terraform" "basic sample"

resource "foo" "bar"{
;        ^^^^^ source.terraform meta.block.terraform variable.other.enummember.terraform
;              ^^^^^ source.terraform meta.block.terraform variable.other.enummember.terraform
}

resource un quoted {
;        ^^ source.terraform meta.block.terraform variable.other.enummember.terraform
;           ^^^^^^ source.terraform meta.block.terraform variable.other.enummember.terraform
}
