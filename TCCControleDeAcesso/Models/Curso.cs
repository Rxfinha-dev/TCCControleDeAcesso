using System;
using System.Data;
using System.Windows.Forms;
using MySql.Data.MySqlClient;

namespace TCCControleDeAcesso.Models
{
    public class Curso
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int idEscola { get; set; }
    }
}
