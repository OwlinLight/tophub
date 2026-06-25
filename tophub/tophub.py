import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).with_name("src")))

from tophub_server import create_mcp_server


def main():
    mcp = create_mcp_server()
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
