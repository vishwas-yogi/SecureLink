from typing import TypedDict

class FacialArea(TypedDict):
    x: int
    y: int
    w: int
    h: int
    left_eye: tuple[int, int]
    right_eye: tuple[int, int]
    nose: tuple[int, int]
    mouth_left: tuple[int, int]
    mouth_right: tuple[int, int]

class EmbeddingObject(TypedDict):
    embedding: list[float]  
    facial_area: FacialArea
    face_confidence: float  