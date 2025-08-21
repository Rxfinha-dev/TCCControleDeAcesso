using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;
namespace TCCControleDeAcesso.Models
{
    public class Verificacao
    {
        public int Id { get; set; }
        public string name { get; set; }

        public  string rm {  get; set; }
        public string serie { get; set; }

        public string ano { get; set; }

       
    }
}
