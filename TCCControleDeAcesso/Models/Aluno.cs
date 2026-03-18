using System;
using System.Collections.Generic;
using System.Data;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Views;



namespace TCCControleDeAcesso.Models
{
    
    public class Aluno
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string rm { get; set; }   
        public string serie { get; set; }
        public string idade { get; set; }
        public int idArduino { get; set; }
        public int idEscola { get; set; }
        public string NomeCurso { get; set; }
        public byte[] foto { get; set; }
        public UInt16 digital { get; set; }
    }
}
