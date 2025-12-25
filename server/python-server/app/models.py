from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text)
    email = Column(Text, unique=True, index=True)
    password = Column(Text)
    privileges = Column(Text, default="user")
    
    # Relaciones
    projects = relationship("Project", back_populates="creator")
    tasks = relationship("Task", back_populates="creator")
    ideas = relationship("Idea", back_populates="creator")
    documents = relationship("DocumentManagementFile", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Text, default="activo")
    visibility = Column(Text, default="privado")
    
    # Relaciones
    creator = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project")
    ideas = relationship("Idea", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(Text)
    priority = Column(Text)
    title = Column(Text)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Text, default="active")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    project_task_number = Column(Integer, nullable=False)
    
    __table_args__ = (UniqueConstraint('project_id', 'project_task_number'),)
    
    # Relaciones
    creator = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    assignees = relationship("TaskAssignee", back_populates="task")

class TaskAssignee(Base):
    __tablename__ = "task_assignees"
    
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    
    # Relaciones
    task = relationship("Task", back_populates="assignees")
    user = relationship("User")

class Invitation(Base):
    __tablename__ = "invitations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    resource_type = Column(Text)  
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(Text, default="viewer")
    status = Column(Text, default="pending")
    receiver_email = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class ResourceAccess(Base):
    __tablename__ = "resource_access"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    resource_type = Column(Text)  
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(Text, default="viewer")
    
    __table_args__ = (UniqueConstraint('user_id', 'resource_type', 'resource_id'),)
    
    # Relaciones
    user = relationship("User")

class Idea(Base):
    __tablename__ = "ideas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(Text)
    status = Column(Text, default="pending")
    priority = Column(Text, default="medium")
    implementability = Column(Text, default="medium")
    impact = Column(Text, default="medium")
    votes = Column(Integer, default=0)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    idea_number = Column(Integer, nullable=False)
    
    __table_args__ = (UniqueConstraint('project_id', 'idea_number'),)
    
    # Relaciones
    project = relationship("Project", back_populates="ideas")
    creator = relationship("User", back_populates="ideas")

class IdeaVote(Base):
    __tablename__ = "idea_votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idea_id = Column(UUID(as_uuid=True), ForeignKey("ideas.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    value = Column(Integer)  # 1 o -1
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (UniqueConstraint('idea_id', 'user_id'),)

class DocumentManagementFile(Base):
    __tablename__ = "document_management_file"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"))
    code = Column(Text, nullable=False)
    company = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    classification_chart = Column(JSON, default=list)
    retention_schedule = Column(JSON, default=list)
    entry_register = Column(JSON, default=list)
    exit_register = Column(JSON, default=list)
    loan_register = Column(JSON, default=list)
    transfer_list = Column(JSON, default=list)
    topographic_register = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    user = relationship("User", back_populates="documents")

class OrganizationChart(Base):
    __tablename__ = "organization_chart"
    
    file_id = Column(UUID(as_uuid=True), primary_key=True)
    data = Column(JSON)