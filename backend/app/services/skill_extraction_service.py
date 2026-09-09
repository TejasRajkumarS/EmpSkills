import re
from typing import List, Dict, Set
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.services.data_service import data_service
from app.models import Skill, EmployeeSkill


class SkillExtractionService:
    def __init__(self):
        self._skill_names = {}
        self._skill_aliases = {}
        self._tfidf_vectorizer = None
        self._skill_vectors = None
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        skills = data_service.get_skills()
        for skill in skills:
            name_lower = skill.skill_name.lower()
            self._skill_names[name_lower] = skill.skill_id
            self._skill_names[skill.skill_id.lower()] = skill.skill_id
            self._skill_aliases[name_lower] = skill.skill_id

        skill_texts = [skill.skill_name for skill in skills]
        self._tfidf_vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            stop_words='english'
        )
        self._skill_vectors = self._tfidf_vectorizer.fit_transform(skill_texts)
        self._initialized = True

    def extract_skills_from_text(self, profile_text: str) -> List[str]:
        self.initialize()
        detected_skill_ids = set()
        text_lower = profile_text.lower()

        # Direct name matching
        for name, skill_id in self._skill_names.items():
            if re.search(r'\b' + re.escape(name) + r'\b', text_lower):
                detected_skill_ids.add(skill_id)

        # TF-IDF similarity for fuzzy matching
        if self._tfidf_vectorizer and self._skill_vectors is not None:
            profile_vector = self._tfidf_vectorizer.transform([profile_text])
            similarities = cosine_similarity(profile_vector, self._skill_vectors).flatten()
            threshold = 0.3
            for idx, sim in enumerate(similarities):
                if sim > threshold:
                    skill = data_service.get_skills()[idx]
                    detected_skill_ids.add(skill.skill_id)

        return list(detected_skill_ids)

    def get_skill_by_name(self, name: str) -> Skill | None:
        self.initialize()
        skill_id = self._skill_names.get(name.lower())
        if skill_id:
            return data_service.get_skill(skill_id)
        return None


skill_extraction_service = SkillExtractionService()