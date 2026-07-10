FROM ubuntu:20.04

USER root

RUN apt-get update && apt-get install -y openssh-server

EXPOSE 22

CMD ["/bin/bash"]
