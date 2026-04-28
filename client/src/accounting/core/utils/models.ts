export interface ProductoInventario {
    id: string
    productoId: string         //-- referencia a Producto o ProductoCompra
    tipoProducto: "VENTA" | "COMPRA"       //-- "VENTA" o "COMPRA"
    stockDisponible: number    //-- cantidad actual
    modoStock: "ILIMITADO" | "MANUAL" | "VINCULADO"

    //solo si modoStock = VINCULADO
    // Nota, usamos un array ya que un producto a la venta podria depender de mas de un producto en alamacen
    productoCompraVinculadoId: string[] 

    // indicamos la cantisad eqivalente de cada uno de los elementos indicados en el primer array
    ratioConversion: number[]   //-- cuántas unidades de venta = 1 unidad de compra
    ultimaActualizacion: string
}



// diseñar un modelo para venta de servicios,en el caso de venta de servicios, se definen servicios pero no siempre es posible definir el precio del servicio ya que este puede variar, por ejemplo un agente de telecomunicaciones vende saldo a peticion de la acntidad que quiera recargar el cliente y no es definible un pago fijo, en otros casos puede calcularse en cuando a horas de trabajo, o en cuanto a acciones realizadas. para la seccion de servicios indicamos nombre del servicio y de forma opcional precio, si no se define precio previo entonces este campo se llenara al momento de consertar la compra u operacion que corresponda al cobro por el servicio.

export interface Servicio{
    id: string
    nombre: string
    tipo_de_cobro: "libre" | "por_horas" | "predefinido" | "vinculado" | "mixto" | "tarifa"
    // - Libre: se indica al momento de cobrar
    // - Por horas: al momento de cobrar se indica cantidad de horas trabajadas
    // - Predefinido: se indica de antmano un precio fijo para dicho servicio
    // - Vinculado: se usa para cobrar en dependecia de la vinculacion de ese servicio a la utilizacion de materias primas, en este caso al confugurar el servicio se indican las materias primas a utilizar, se deve crear una lista de materias primas el precio de compra y el precio de venta.
    // - Mixto: incluye mas de una forma de cobro, por ejemplo, precio de los materiales mas costo por horas de mano de obra o precio fijo o predefinido, deve abrir un arbol de indicacion de varios metodos de cobro para establecer un precio de forma adecuada
    // Tarifa: es un metodo de cobro medaiante el cual definimos precio en dependecia de cantidad de recursos utilisados de forma incremental o decremental, por ejemplo si un servicio te llevo solo 20 minutos los primeros 20 minutios se cobran a un precio base, los proximos 20 minutos se cobran a otro precio, en este caso la interas deve indicar rangos, pero depende tambien de que tipo de rango usas, si es tarifa por tiempo o tarifa por consumo de otro recuro, se estableceria una interfaz que indique recurso y rango de utilizacion de ese recurso.
}