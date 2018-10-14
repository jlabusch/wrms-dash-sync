.PHONY: deps build network start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-sync
NAME=wrms-dash-sync
CONFIG_VOL=wrms-dash-config-vol
NETWORK=wrms-dash-net
BUILD=$(shell ls ./wrms-dash-build-funcs/build.sh 2>/dev/null || ls ../wrms-dash-build-funcs/build.sh 2>/dev/null)
SHELL:=/bin/bash

deps:
	@test -n "$(BUILD)" || (echo 'wrms-dash-build-funcs not found; do you need "git submodule update --init"?'; false)
	@echo "Using $(BUILD)"
	@$(BUILD) volume exists $(CONFIG_VOL) || $(BUILD) error "Can't find docker volume $(CONFIG_VOL) - do you need to \"make config\" in wrms-dash?"

build: deps
	@mkdir -p ./config
	$(BUILD) cp alpine $(CONFIG_VOL) $$PWD/config /vol0/default.json /vol1/
	$(BUILD) build $(IMAGE)
	@rm -fr ./config

network:
	$(BUILD) network create $(NETWORK)

start: network
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --rm \
        $(IMAGE)
	$(DOCKER) logs -f $(NAME) &

stop:
	$(DOCKER) stop $(NAME)

clean:
	$(BUILD) image delete $(IMAGE) || :

