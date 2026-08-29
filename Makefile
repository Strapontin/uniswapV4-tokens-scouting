.PHONY: install dev build start py findtokennames viewer-install viewer-dev viewer-build viewer-start viewer-lint viewer-clean clean

NODE_MODULES := node_modules
VIEWER_DIR := pool-initialize-viewer

# Install Node dependencies.
install:
	npm install

# Scan all JSON logs in ./logs, collect token addresses from the Initialize events,
# fetch missing ERC20 metadata (name, symbol, decimals) with viem,
# and save the merged results to ./logs/token_metadata.json.
findtokennames:
	npm run dev

# Install dependencies for the pool initialization viewer.
viewer-install:
	cd $(VIEWER_DIR) && npm install

# Run the pool initialization viewer in development mode.
viewer-dev:
	cd $(VIEWER_DIR) && npm run dev

# Run the production build for the pool initialization viewer.
viewer-build:
	cd $(VIEWER_DIR) && npm run build

# Run the production pool initialization viewer.
viewer-start:
	cd $(VIEWER_DIR) && npm run start

# Lint the pool initialization viewer.
viewer-lint:
	cd $(VIEWER_DIR) && npm run lint

# Clean the pool initialization viewer build artifacts and dependencies.
viewer-clean:
	rm -rf $(VIEWER_DIR)/.next $(VIEWER_DIR)/node_modules

# Run the TypeScript build.
build:
	npm run build

# Run the compiled JS output.
start:
	npm run start

# Fetch Uniswap PoolManager "Initialize" logs from the Etherscan API for a target token,
# save the raw JSON response, and store it in a timestamped file in the project root.
py:
	python script.py

# Clean built artifacts and installed modules.
clean:
	rm -rf dist $(NODE_MODULES)

# Print all available Make commands.
help:
	@grep -E '^[a-zA-Z_-]+:' Makefile | sed 's/://g' | sort

