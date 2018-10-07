.PHONY: build network start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-sync
NAME=wrms-dash-sync
CONFIG_VOL=wrms-dash-config-vol
NETWORK=wrms-dash-net

build:
	$(DOCKER) build -t $(IMAGE) .

network:
	$(DOCKER) network list | grep -q $(NETWORK) || $(DOCKER) network create $(NETWORK)

start:
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --volume $(CONFIG_VOL):/opt/config:ro \
        --rm \
        $(IMAGE)
	$(DOCKER) logs -f $(NAME) &

stop:
	$(DOCKER) stop $(NAME)

clean:
	$(DOCKER) rmi $(IMAGE) $$($(DOCKER) images --filter dangling=true -q)

