{
  inputs,
  pkgs,
  mkShell,
  system,
  ...
}:
let
  commitCheck = inputs.self.checks.${system}.pre-commit-check.shellHook;
  node = pkgs.nodejs;
in
mkShell {
  packages = with pkgs; [
    node2nix
    node
    corepack

    # @antfu/ni
    ni
  ];

  shellHook = ''
    ${commitCheck}

    # Disable download prompt for corepack
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
    echo "node version: `${node}/bin/node --version`"
  '';

  buildInputs = inputs.self.checks.${system}.pre-commit-check.enabledPackages;
}
