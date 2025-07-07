export type Employee = {
  id: string
  name: string
  position: string
  department: string
  email: string
  avatar?: string
  children?: Employee[]
}
