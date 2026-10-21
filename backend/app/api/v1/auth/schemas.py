from pydantic import BaseModel, EmailStr, Field


class RegistroIn(BaseModel):
    nombre: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=4, max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str