FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir uv && uv pip install --system --no-cache -r pyproject.toml --extra dev

COPY . .
RUN mkdir -p uploads

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
