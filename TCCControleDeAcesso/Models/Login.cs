using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TCCControleDeAcesso.Models
{
    public class Login
    {
        public int id { get; set; }
        public string nome { get; set; }
        public string senha { get; set; }
        public string email { get; set; }
        public int idEscola { get; set; }
        public string HashBanco { get; set; }
        public int count;
    }
}
