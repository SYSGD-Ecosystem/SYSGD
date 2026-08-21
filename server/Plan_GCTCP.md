# Actualizar sistema de gestion debae de datos y logica de negicios para registros de la app de gestion contable.

- Actualmente la app utiliza una base de dfatos tonta, esta se encarga de guardar un determinao registro vinculado a un determinado usuario, esto trae problemas de complegidad cuando el volumen de datos del usuario crece y se desean crear nuevos registros.

- Objetivos de lo que se buscaria hacer, ahora cada espacio de trabajo tendria un id propio, de echo ya los tiene a nivel de la app, lo que camvia es que ya no se guardaria todo mesclado en un solo json gigate si no que cada espacio de trabajo se guardaia en un row independiente, esto disminulle el volumen de datos a tratar ya que no se actualizaria todo a cada cambio en cada peticion.

- o mas importante, con los espacios de trabajo separados por rows independientes, cada espacio de trabajo pertenece a un id de usuario propietario o administrador de dicho espacio, se creara una tabla de acesos, esto sgnifica que un eterminado usuario podra permitir o dar acceso a otro usuario ya sea para quetrabaje sobre esos registros o solo tenga permiso de lectura.

- Gran parte del sistema ya ha utilizado cosas similares en el pasado, investigar como se desarrollo la seccion de proyectos puede ser un buen punto de partida, tambien el sistema de invitaciones.