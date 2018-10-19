.PHONY: deps build network start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-sync
NAME=wrms-dash-sync
NETWORK=wrms-dash-net
BUILD=$(shell ls ./wrms-dash-build-funcs/build.sh 2>/dev/null || ls ../wrms-dash-build-funcs/build.sh 2>/dev/null)
SHELL:=/bin/bash

deps:
	@test -n "$(BUILD)" || (echo 'wrms-dash-build-funcs not found; do you need "git submodule update --init"?'; false)
	@echo "Using $(BUILD)"

build: deps
	$(BUILD) build $(IMAGE)

network:
	$(BUILD) network create $(NETWORK)

start: network
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --env CONFIG \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --rm \
        $(IMAGE) start
	$(DOCKER) logs -f $(NAME) &

stop:
	$(DOCKER) stop $(NAME)

clean:
	@rm -fr ./config
	$(BUILD) image delete $(IMAGE) || :

