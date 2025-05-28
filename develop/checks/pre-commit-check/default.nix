{ inputs, system, ... }:
inputs.pre-commit-hooks.lib.${system}.run {
  src = ../../..;

  # see: https://devenv.sh/reference/options/#pre-commithooks
  hooks = {
    # you can use the following formatter

    # biome.enable = true;
    # denofmt.enable = true;
    # denolint.enable = true;
    # eslint.enable = true;

    # or

    # my-formatter = {
    #   enable = true;
    #   name = "my-formatter";
    #   description = "Run My Formatter on all files in the project";
    #   files = "\.js$";
    #   entry = "${pkgs.my-formatter}/bin/ctl";
    # };
  };
}
