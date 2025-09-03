using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TCCControleDeAcesso
{
    public static class DatabaseServices
    {
        private static string _servidor = "localhost";
        private static string _nome = "AccessControl";
        private static string _user = "root";
        private static string _senha = "etecjau";

        public static string Connection = "server = localhost; port=3307;uid=root;pwd=etecjau;database=AccessControl;";
    }
}
