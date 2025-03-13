using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;


namespace TCCControleDeAcesso.Models
{
    public class CadastroAlunos
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string rm {  get; set; }
        public int idCurso {  get; set; }
        public int idEscola {  get; set; }
        public int  serie {  get; set; }
        public UInt16 foto { get; set; }
        public UInt16 digital{ get; set; }



        public void Insert()
        {
            try
            {
                Banco.OpenConnection();

            Banco.Command = new MySqlCommand("insert into Alunos");

            }
            catch (Exception e) {
            
                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            
            }
        }
    }
}
