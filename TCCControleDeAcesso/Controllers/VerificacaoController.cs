using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Controllers
{
    public class VerificacaoController
    {
        Verificacao verifClass = new Verificacao();
        public DataTable select()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("select id,nome, rm,idade, serie, curso from Alunos where id=@id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", verifClass.Id);
                Banco.DataAdapter = new MySqlDataAdapter(Banco.Command);
                Banco.datTable = new DataTable();
                Banco.DataAdapter.Fill(Banco.datTable);
                //Banco.CloseConnection();
                return Banco.datTable;
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return null;
            }
        }
    }
}
